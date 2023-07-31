import {
  equals, filterObject, intersection, prop, uniq, zipObj,
} from 'rambdax'
import type {
  ConditionalExcept,
  FixedLengthArray,
  IsNever,
  JsonValue,
  LiteralUnion,
  RequireExactlyOne,
  Simplify,
  ValueOf,
} from 'type-fest'
import type {
  ChromaStatic, Color,
} from 'chroma-js'
import chroma from 'chroma-js'
import { pie, } from 'd3-shape'
import type {
  I, L, N,
} from 'ts-toolbelt'
import type { KeyFnKey, } from './types.d'

type ChildType<ThisNode> = ThisNode extends Node<
  infer Datum,
  infer KeyFunctions,
  infer Depth,
  infer Height
>
  ? KeyFunctions extends unknown[]
    ? Depth extends L.KeySet<0, KeyFunctions['length']>
      ? Height extends 0
        ? never
        : Node<Datum, KeyFunctions, N.Add<Depth, 1>>
      : never
    : never
  : never

type ParentType<ThisNode> = ThisNode extends Node<
  infer Datum,
  infer KeyFunctions,
  infer Depth,
  infer Height
>
  ? KeyFunctions extends readonly unknown[]
    ? Depth extends L.KeySet<0, KeyFunctions['length']>
      ? Depth extends 0
        ? never
        : Node<Datum, KeyFunctions, N.Sub<Depth, 1>>
      : never
    : never
  : never

type DescendantIter<
  ThisNode,
  Descendant = ThisNode
> = IsNever<ThisNode> extends true
  ? Descendant
  : DescendantIter<ChildType<ThisNode>, Descendant | ThisNode>

type AncestorArray<ThisNode, AncestorList extends L.List = []> = IsNever<
  ParentType<ThisNode>
> extends true
  ? [...AncestorList, ThisNode]
  : AncestorArray<ParentType<ThisNode>, [...AncestorList, ThisNode]>

type GetDimIndex<Dims, DimVal, Iter extends I.Iteration = I.IterationOf<-1>> = Dims extends readonly [
  infer First,
  ...infer Rest
]
  ? First extends DimVal
    ? I.Pos<I.Next<Iter>>
    : GetDimIndex<Rest, DimVal, I.Next<Iter>>
  : never

export class Node<
  Datum,
  KeysOfDatum extends FixedLengthArray<KeyFnKey<Datum>, L.KeySet<1, 13>>,
  Depth extends L.KeySet<0, KeysOfDatum['length']> = 0,
  Height extends N.Sub<KeysOfDatum['length'], Depth> = N.Sub<
    KeysOfDatum['length'],
    Depth
  >
> {
  constructor(
    public readonly keyFns: KeysOfDatum,
    public readonly records: Datum[],
    public readonly depth: Depth,
    public readonly height: Height
  ) {
    this.value = records.length
    this.colorScaleNum = records.length

    this.dims = [
      undefined,
      ...keyFns,
    ]
    this.dim = [
      undefined,
      ...keyFns,
    ][depth]
    this.id = prop(
      this.dim,
      this.records[0]
    )
    this.name = prop(
      this.dim,
      this.records[0]
    )
  }

  color = '#cccccc'
  colorScale:
  | LiteralUnion<keyof ChromaStatic['brewer'], string>
  | Array<string | Color> = 'Spectral'

  colorScaleBy:
  | 'allNodesAtDimIds'
  | 'allNodesAtDimValues'
  | 'parentListIds'
  | 'parentListValues' = 'allNodesAtDimIds'

  colorScaleMode: 'e' | 'q' | 'l' | 'k' = 'e'
  colorScaleNum: number
  dim: Depth extends 0 ? undefined : KeysOfDatum[N.Sub<Depth, 1>]
  dims: [undefined, ...KeysOfDatum]
  name: Depth extends 0 ? undefined : ValueOf<Datum>
  id: Depth extends 0 ? undefined : ValueOf<Datum>
  #parent = undefined as unknown as ParentType<this>

  value: number

  children: Array<ChildType<this>> = []

  addChild(this: this, child: ChildType<this>) {
    if (this.height > 0 && !!child) {
      this.children = [
        ...this.children,
        child,
      ]
      child.parent = this
    }
  }

  /**
   * The function to set the value of the node
   * @default
   * pipe(prop('records'), length)
   */
  valueFunction = (rec: this) => rec.records.length

  get parent() {
    return this.#parent
  }

  set parent(parent) {
    this.#parent = parent
  }

  get type() {
    type ReturnType = this['depth'] extends 0
      ? 'root'
      : this['height'] extends 0
        ? 'leaf'
        : 'node'
    if (this.depth === 0)
      return 'leaf' as ReturnType
    else if (this.height === 0)
      return 'root' as ReturnType
    else return 'node' as ReturnType
  }

  *[Symbol.iterator](): Generator<DescendantIter<this>, void, unknown> {
    let node = this
    let current
    let next = [ node, ]
    let children: typeof current
    let i: number
    let n: number

    do {
      current = next.reverse()
      next = []
      while ((node = current.pop()) !== undefined) {
        yield node
        if ((children = node?.children) !== undefined)
          for (i = 0, n = children.length; i < n; ++i) next.push(children[i])
      }
    } while (next.length)
  }

  /**
   *
   * Finds the first ancestor node that matches the specified parameter. The parameter can be either the depth or dimension to find. If the parameter would return this node, the return value is undefined
   *
   * @param depthOrDim A parameter indicating either the depth or the dimension of the ancestor to return.
   * @param depthOrDim.depth The depth of the ancestor to return.
   * @param depthOrDim.dim The dimension of the ancestor to return.
   */
  ancestorAt<
    Params extends RequireExactlyOne<
      {
        depth: L.KeySet<0, Depth>
        dim: [undefined, ...KeysOfDatum][L.KeySet<1, Depth>]
      },
      'depth' | 'dim'
    >
  >(this: Node<Datum, KeysOfDatum, Depth, Height>, depthOrDim: Params) {
    type ReturnType = Params['depth'] extends L.KeySet<0, Depth>
      ? Node<Datum, KeysOfDatum, Params['depth']>
      : GetDimIndex<this['dims'], Params['dim']> extends L.KeySet<1, Depth>
        ? Node<
          Datum,
          KeysOfDatum,
          GetDimIndex<this['dims'], Params['dim']>
        >
        : never

    return this.ancestors().find((node) => {
      if (typeof depthOrDim.depth === 'number')
        return node.depth === depthOrDim.depth
      else return node.dim === depthOrDim.dim
    }) as unknown as ReturnType
  }

  /**
   * @description Returns the array of ancestors nodes, starting with this node, then followed by each parent up to the root.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#ancestors}
   * @see {ancestorAt}
   */
  ancestors<ThisNode extends Node<Datum, KeysOfDatum, Depth, Height>>(this: ThisNode): AncestorArray<ThisNode> {
    const nodes = [ this, ]
    let node = this

    while (
      typeof node !== 'undefined' &&
      'parent' in node &&
      typeof node.#parent !== 'undefined'
    ) {
      nodes.push(node.parent)
      node = node.parent
    }

    return nodes
  }

  /**
   * @description Returns the array of descendant nodes, starting with this node.
   *
   */
  descendants(this: Node<Datum, KeysOfDatum, Depth, Height>) {
    return Array.from(this)
  }

  descendantsAt<
    Params extends RequireExactlyOne<
      {
        depth: L.KeySet<Depth, KeysOfDatum['length']>
        dim: [undefined, ...KeysOfDatum][L.KeySet<Depth, KeysOfDatum['length']>]
      },
      'depth' | 'dim'
    >
  >(this: Node<Datum, KeysOfDatum, Depth, Height>, depthOrDim: Params) {
    type ReturnType = Params['depth'] extends L.KeySet<Depth, KeysOfDatum['length']>
      ? Node<Datum, KeysOfDatum, Params['depth']>
      : GetDimIndex<this['dims'], Params['dim']> extends L.KeySet<Depth, KeysOfDatum['length']>
        ? Node<
          Datum,
          KeysOfDatum,
          GetDimIndex<this['dims'], Params['dim']>
        >
        : never
    return this.descendants().filter((node) => {
      const {
        depth: paramDepth, dim: paramDim,
      } = depthOrDim

      if (typeof paramDepth === 'number')
        return node.depth === paramDepth
      else return node.dim === paramDim
    }) as unknown as ReturnType[]
  }

  /**
   * Invokes the specified function for node and each descendant in breadth-first order,
   * such that a given node is only visited if all nodes of lesser depth have already been
   * visited, as well as all preceding nodes of the same depth. The specified function is
   * passed the current descendant, the zero-based traversal index, and this node. If that
   * is specified, it is the this context of the callback.
   * @see {@link https://github.com/d3/d3-hierarchy#each}
   * @see {@link eachBefore}
   * @see {@link eachAfter}
   */
  each(
    this: this,
    callback: (
      node: DescendantIter<Node<Datum, KeysOfDatum, Depth>>,
      index?: number
    ) => void
  ): this {
    let index = -1

    for (const node of this) {
      callback(
        node,
        ++index
      )
    }

    return this
  }

  /**
   * Invokes the specified function for node and each descendant in post-order traversal,
   * such that a given node is only visited after all of its descendants have already been
   * visited. The specified function is passed the current descendant, the zero-based traversal
   * index, and this node. If that is specified, it is the this context of the callback.
   */
  eachAfter(
    this: this,
    callback: (
      node: DescendantIter<Node<Datum, KeysOfDatum, Depth>>,
      index?: number
    ) => void
  ): this {
    const nodes = [ this, ]
    const next = []
    let children
    let i
    let index = -1
    let node

    while ((node = nodes.pop()) !== undefined) {
      next.push(node)
      if ((children = node?.children) !== undefined)
        for (i = 0, n = children.length; i < n; ++i) nodes.push(children[i])
    }
    while ((node = next.pop()) !== undefined) {
      callback(
        node,
        ++index
      )
    }

    return this
  }

  /**
   * Invokes the specified function for node and each descendant in pre-order traversal, such
   * that a given node is only visited after all of its ancestors have already been visited.
   * The specified function is passed the current descendant, the zero-based traversal index,
   * and this node. If that is specified, it is the this context of the callback.
   * @see {@link https://github.com/d3/d3-hierarchy#eachBefore}
   * @see {@link each}
   * @see {@link eachAfter}
   */
  eachBefore(
    this: this,
    callback: (
      node: DescendantIter<Node<Datum, KeysOfDatum, Depth>>,
      index?: number
    ) => void
  ): this {
    const nodes = [ this, ]
    let children
    let i
    let index = -1
    let node

    while ((node = nodes.pop()) !== undefined) {
      callback(
        node,
        ++index
      )
      if ((children = node?.children) !== undefined)
        for (i = children.length - 1; i >= 0; --i) nodes.push(children[i])
    }
    return this
  }

  /**
   * Returns the first node in the hierarchy from this node for which the specified filter returns a truthy value. undefined if no such node is found.
   * @see {@link https://github.com/d3/d3-hierarchy#find}
   */
  find(
    this: this,
    callback: (
      node: DescendantIter<Node<Datum, KeysOfDatum, Depth>>,
      index?: number
    ) => boolean
  ): this | undefined {
    for (const node of this) {
      const test = callback(node)

      if (test)
        return node
    }
  }

  isRoot(): this is Node<Datum, KeysOfDatum, 0> {
    return this?.depth === 0
  }

  isLeaf(): this is Node<Datum, KeysOfDatum, L.Length<KeysOfDatum>> {
    return this?.height === 0
  }

  /**
   * @description Returns the array of leaf nodes for this node
   *
   * @see {@link https://github.com/d3/d3-hierarchy#leaves}
   */
  leaves(): Array<Node<Datum, KeysOfDatum, L.Length<KeysOfDatum>>> {
    const leaves = [] as unknown as Array<
      Node<Datum, KeysOfDatum, L.Length<KeysOfDatum>>
    >

    this.eachBefore((node) => {
      if (!node.height)
        leaves.push(node)
    })
    return leaves
  }

  /**
   * Returns an array of links for this node and its descendants, where each *link* is an object that defines source and target properties. The source of each link is the parent node, and the target is a child node.
   * @see {@link https://github.com/d3/d3-hierarchy#links}
   * @see {@link path}
   */
  links(this: this) {
    const links = [] as Array<
      {
        [Key in L.KeySet<Depth, L.Length<KeysOfDatum>>]: {
          source: Key extends 0
            ? undefined
            : Simplify<
                Node<Datum, KeysOfDatum, Key, N.Sub<L.Length<KeysOfDatum>, Key>>
              >['parent']
          target: Simplify<
            Node<Datum, KeysOfDatum, Key, N.Sub<L.Length<KeysOfDatum>, Key>>
          >
        }
      }[L.KeySet<Depth, L.Length<KeysOfDatum>>]
    >

    this.each((node) => {
      // Don't include the root's parent, if any.
      links.push({
        source: node.parent,
        target: node,
      })
    })
    return links
  }

  makePies(
    this: this,
    pieStart: number,
    pieEnd: number,
    piePadding = 0,
    paddingMaxDepth = 1
  ) {
    for (const node of this) {
      const parent = node.parent
      const children = parent.children
      const minParentArcWidth = children
        .map(p => p.endAngle ?? 0 - p.startAngle ?? 0)
        .reduce((a, b) => Math.min(
          a,
          b
        ))
      const nodePadAngle =
        node.depth === 1 ?
          piePadding :
          node.depth <= paddingMaxDepth ?
            min(
              node.parent.padAngle,
              minParentArcWidth
            ) / children.length :
            0
      const nodePieStart = node.depth === 1 ? pieStart : node.parent.startAngle
      const nodePieEnd = node.depth === 1 ? pieEnd : node.parent.endAngle
      const pies = pie()
        .startAngle(nodePieStart)
        .endAngle(nodePieEnd)
        .padAngle(nodePadAngle)
        .sort((a, b) => {
          // const sortA = a.leaves()[0]?.data?.[inputs.value.sourceName.value]
          if ((a.value ?? 0) > (b.value ?? 0))
            return pieStart > Math.PI ? 1 : -1
          if ((a.value ?? 0) < (b.value ?? 0))
            return pieStart > Math.PI ? -1 : 1
          return 0
        })
        .value(d => d.value ?? 1)(children)

      pies.forEach((p, i) => {
        if (p.data.id === node.id) {
          const {
            startAngle: startAngleIn, endAngle: endAngleIn, padAngle,
          } = p
          const startAngle = startAngleIn
          const endAngle = endAngleIn - padAngle

          node.padAngle = padAngle
          node.startAngle = startAngle
          node.endAngle = endAngle
          const arcWidthRadians = endAngleIn - startAngleIn - padAngle
          const halfAngle = arcWidthRadians / 2
          const rotationsRaw = (halfAngle + startAngle) / 2 / Math.PI
          const rotations =
            halfAngle + startAngle < 0 ?
              rotationsRaw - Math.ceil(rotationsRaw) :
              rotationsRaw - Math.floor(rotationsRaw)
          const paperMidPoint = angleConverter.toPaper(halfAngle + startAngle)

          node.midPointAngle = {
            radians: halfAngle + startAngle,
            degrees: ((halfAngle + startAngle) * 180) / Math.PI,
            paper: paperMidPoint,
            rotations,
            side:
              paperMidPoint < 0 ?
                paperMidPoint > -90 ?
                  'right' :
                  'left' :
                paperMidPoint > 90 ?
                  'left' :
                  'right',
          }
          node.nodeArcWidth = {
            radians: arcWidthRadians,
            degrees: (arcWidthRadians * 180) / Math.PI,
          }
          node.paperAngles = {
            startAngle: angleConverter.toPaper(node.startAngle),
            endAngle: angleConverter.toPaper(node.endAngle),
            padAngle: (node.padAngle * 180) / Math.PI,
            midPointAngle: paperMidPoint,
          }
        }
      })
    }
  }

  /**
   * @description Returns the shortest path through the hierarchy from this node to the specified target node. The path starts at this node, ascends to the least common ancestor of this node and the target node, and then descends to the target node. This is particularly useful for hierarchical edge bundling.
   * @see {@link https://github.com/d3/d3-hierarchy#node_path}
   * @see {@link links}
   */
  path(this: this, end: DescendantIter<Node<Datum, KeysOfDatum, 0>>) {
    let start = this
    const ancestor = leastCommonAncestor(
      start,
      end
    )
    const nodes = [ start, ]

    while (start !== ancestor) {
      start = start.parent
      nodes.push(start)
    }
    const k = nodes.length

    while (end !== ancestor) {
      nodes.splice(
        k,
        0,
        end
      )
      end = end.parent
    }
    return nodes
  }

  setColor(
    this: this,
    scale?: this['colorScale'],
    scaleBy?: this['colorScaleBy'],
    scaleMode?: this['colorScaleMode'],
    scaleNum?: this['colorScaleNum']
  ): Node<Datum, KeysOfDatum, Depth> {
    this.each((node) => {
      if (typeof node === 'undefined' || node === null) {
      }
      else {
        if (typeof scaleBy !== 'undefined')
          node.colorScaleBy = scaleBy
        if (typeof scale !== 'undefined')
          node.colorScale = scale
        if (typeof scaleMode !== 'undefined')
          node.colorScaleMode = scaleMode
        if (typeof scaleNum !== 'undefined')
          node.colorScaleNum = scaleNum
        if (
          (node.colorScaleBy === 'allNodesAtDimIds' ||
            node.colorScaleBy === 'parentListIds') &&
          node.hasParent()
        ) {
          let values: string[] = node.parent!.children!.map(n => n.id)

          if (node.colorScaleBy === 'allNodesAtDimIds') {
            const ancestor = node.ancestorAt({ depth: 0, })

            values = uniq(ancestor
              .descendants()
              .filter(d => d.dim === node.dim)
              .map(n => n.id))
          }
          node.color = zipObj(
            values,
            chroma.scale(node.colorScale).colors(values.length)
          )[node.id]
        }
        else if (node.hasParent()) {
          let values: number[] = node.parent!.children!.map(n => n.value)

          if (node.colorScaleBy === 'allNodesAtDimValues') {
            const ancestor = node.ancestorAt({ depth: 0, })

            values = uniq(ancestor
              .descendants()
              .filter(d => d.dim === node.dim)
              .map(n => n.value))
          }
          const colorValues = chroma.limits(
            values,
            node.colorScaleMode,
            node.colorScaleNum
          )

          node.color = chroma
            .scale(node.colorScale)
            .domain(colorValues)(node.value)
            .hex()
        }
      }
    })
    return this
  }

  /**
   * Sets the value function for this node and its descendants, sets the values based on the value function, and returns this node.
   * @param valueFn a function that receives a node and returns a numeric value
   */
  setValueFunction(this: this, valueFn: this['valueFunction']) {
    this.each(node => (node.valueFunction = valueFn))
    this.setValues()
    return this
  }

  /**
   * Sets the value of this node and its descendants, and returns this node.
   */
  setValues(this: this) {
    this.each((node) => {
      node.value = node.valueFunction(node)
    })
    return this
  }

  toJSON(this: this) {
    const node = filterObject<ConditionalExcept<this, undefined>>(
      (v): v is JsonValue => {
        // if (Array.isArray(v)) return v.length > 0
        // else
        return v !== undefined && typeof v !== 'function'
      },
      this
    )

    // if (node.height === 0)
    //   delete node.children
    return node
  }
}

// export class LeafNode<
//   Datum,
//   KeysOfDatum extends ReadonlyArray<KeyFn<Datum>>
// > extends Node<Datum, KeysOfDatum, L.Length<KeysOfDatum>, 0> {
//   constructor(
//     public readonly keyFns: KeysOfDatum,
//     public readonly records: Datum[],
//     public readonly id: string,
//     public readonly depth = keyFns.length as L.Length<KeysOfDatum>,
//     public readonly height = 0 as const
//   ) {
//     super(
//       keyFns,
//       records,
//       keyFns.length,
//       0,
//       id
//     )
//     this.children = undefined
//   }

//   // declare children: never[]
// }
// export class RootNode<
//   Datum,
//   KeysOfDatum extends ReadonlyArray<KeyFn<Datum>>
// > extends Node<Datum, KeysOfDatum, 0, L.Length<KeysOfDatum>> {
//   constructor(
//     public readonly keyFns: KeysOfDatum,
//     public readonly records: Datum[],
//     public readonly id = undefined,
//     public readonly depth = 0 as const,
//     public readonly height = keyFns.length as L.Length<KeysOfDatum>
//   ) {
//     super(
//       keyFns,
//       records,
//       0,
//       keyFns.length,
//       id
//     )
//   }

//   // #parent = undefined

//   // declare #parent: never
// }

function leastCommonAncestor<ANode extends Node, BNode extends Node>(
  a: ANode,
  b: BNode
) {
  if (equals(
    a,
    b
  ))
    return a
  const aNodes = a.ancestors()
  const bNodes = b.ancestors()
  const [ c, ] = intersection(
    aNodes,
    bNodes
  )

  return c ?? null
}
