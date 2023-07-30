import {
  anyPass,
  equals,
  filterObject,
  intersection,
  is,
  uniq,
  zipObj,
} from 'rambdax'
import type {
  ConditionalExcept,
  FixedLengthArray,
  Get,
  IsNever,
  JsonObject,
  JsonValue,
  LiteralUnion,
  RequireExactlyOne,
  Simplify,
} from 'type-fest'
import type {
  ChromaStatic, Color,
} from 'chroma-js'
import chroma from 'chroma-js'
import { pie, } from 'd3-shape'
import type {
  I, L, N,
} from 'ts-toolbelt'
import type {
  // GetDims,
  IndexOfElement,
  KeyFn,
  KeyFnKey,
  KeyFnTuple,
} from './types.d'

type GetDims<
  KeyFunctions extends L.List,
  StartDepth extends L.KeySet<0, L.Length<KeyFunctions>> = 0,
  EndDepth extends L.KeySet<0, L.Length<KeyFunctions>> = L.Length<KeyFunctions>,
  Iter extends I.Iteration = StartDepth extends 0
    ? I.IterationOf<-1>
    : I.IterationOf<StartDepth>,
  Arr extends L.List = readonly []
> = {
  1: I.Pos<Iter> extends -1
    ? GetDims<
        KeyFunctions,
        StartDepth,
        EndDepth,
        I.Next<Iter>,
        [...Arr, undefined]
      >
    : Get<L.ObjectOf<KeyFunctions>, `${I.Pos<Iter>}`> extends readonly unknown[]
      ? GetDims<
        KeyFunctions,
        StartDepth,
        EndDepth,
        I.Next<Iter>,
        [...Arr, Get<L.ObjectOf<KeyFunctions>, [`${I.Pos<Iter>}`, '0']>]
      >
      : GetDims<
        KeyFunctions,
        StartDepth,
        EndDepth,
        I.Next<Iter>,
        [...Arr, Get<L.ObjectOf<KeyFunctions>, `${I.Pos<Iter>}`>]
      >
  0: Arr
}[N.Lower<I.Pos<Iter>, EndDepth>]

type ChildType<ThisNode> = ThisNode extends {
  depth: number
  height: number
  records: Array<infer Datum>
  keyFns: infer KeyFunctions
}
  ? Datum extends string | JsonObject
    ? ThisNode['depth'] extends L.Length<KeyFunctions>
      ? never
      : ThisNode['height'] extends 0
        ? never
        : Node<
            Datum,
            KeyFunctions,
            N.Add<ThisNode['depth'], 1>,
          >
    : never
  : never

type ParentType<ThisNode> = ThisNode extends {
  depth: number
  height: number
  records: Array<infer Datum>
  keyFns: infer KeyFunctions
}
  ? KeyFunctions extends ReadonlyArray<KeyFn<Datum>>
    ? ThisNode['depth'] extends 0
      ? never
      : Node<
          Datum,
          KeyFunctions,
          N.Sub<ThisNode['depth'], 1>,
        >
    : never
  : never

type DescendantIter<ThisNode, Iter = ThisNode> = IsNever<ThisNode> extends false
  ? DescendantIter<
    ChildType<ThisNode>,
    Iter | ThisNode
  >
  : Iter

type AncestorArray<ThisNode, AncestorList extends L.List = []> = IsNever<
  ParentType<ThisNode>
> extends false
  ? AncestorArray<ParentType<ThisNode>, L.Append<AncestorList, ThisNode>>
  : L.Append<AncestorList, ThisNode>

export class Node<
  Datum,
  KeyFuncs extends FixedLengthArray<KeyFn<Datum>, L.KeySet<1, 13>>,
  Depth extends L.KeySet<0, KeyFuncs['length']> = 0,
  Height extends L.KeySet<0, KeyFuncs['length']> = N.Sub<KeyFuncs['length'], Depth>
> {
  constructor(
    public readonly keyFns: KeyFuncs,
    public readonly records: Datum[],
    public readonly depth: Depth,
    public readonly height: Height,
    public readonly id: Depth extends 0 ? undefined : string
  ) {
    this.name = id
    this.value = records.length
    this.colorScaleNum = records.length
    this.dims = keyFns.reduce(
      (acc, keyFn) => {
        if (acc.length === 0)
          acc.push(undefined)
        if (isKeyofKeyFn(keyFn)) {
          acc.push(keyFn)
        }
        else if (isTupleKeyFn(keyFn)) {
          const [
            dim,
            fn,
          ] = keyFn

          if (typeof fn === 'function')
            acc.push(dim)
        }
        return acc
      },
      []
    ) as unknown as GetDims<KeyFuncs>
    const dimDepth = depth as unknown as keyof GetDims<KeyFuncs>

    this.dim = this.dims[dimDepth]

    function isKeyofKeyFn(keyFn: unknown | KeyFnKey<Datum>): keyFn is KeyFnKey<Datum> {
      return anyPass([
        is(String),
        is(Number),
        is(Symbol),
      ])(keyFn)
    }
    function isTupleKeyFn(keyFn: unknown | KeyFnTuple<Datum>): keyFn is KeyFnTuple<Datum> {
      const [
        , fn,
      ] = keyFn as KeyFnTuple<Datum>

      return typeof fn === 'function'
    }
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
  dim: Get<L.ObjectOf<GetDims<KeyFuncs>>, `${this['depth']}`>
  dims: GetDims<KeyFuncs>
  name: this['id']
  #parent = undefined as unknown as ParentType<this>

  value: number

  children: Array<ChildType<this>> = []

  addChild(this: Node<Datum, KeyFuncs, Depth>, child: ChildType<this>) {
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
  valueFunction = (rec: unknown) => rec.records.length

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
        dim: this['dims'][L.KeySet<0, Depth>]
      },
      'depth' | 'dim'
    >
  >(this: Node<Datum, KeyFuncs, Depth>, depthOrDim: Params) {
    type DimKey = IndexOfElement<this['dims'], Params['dim']>

    type ReturnType = Params['depth'] extends L.KeySet<0, Depth>
      ? Node<Datum, KeyFuncs, Params['depth']>
      : IsNever<DimKey> extends true
        ? never
        : Node<Datum, KeyFuncs, DimKey>

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
  ancestors(this: Node<Datum, KeyFuncs, Depth>): AncestorArray<this> {
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

    return nodes as unknown as AncestorArray<
      Node<Datum, KeyFuncs, Depth, Height>
    >
  }

  /**
   * @description Returns the array of descendant nodes, starting with this node.
   *
   */
  descendants(this: Node<Datum, KeyFuncs, Depth>) {
    return Array.from(this)
  }

  descendantsAt<
    Params extends RequireExactlyOne<
      {
        depth: L.KeySet<Depth, L.Length<KeyFuncs>>
        dim: this['dims'][L.KeySet<Depth, L.Length<KeyFuncs>>]
      },
      'depth' | 'dim'
    >
  >(this: Node<Datum, KeyFuncs, Depth>, depthOrDim: Params) {
    type DimKey = IndexOfElement<this['dims'], Params['dim']>

    type ReturnType = Params['depth'] extends L.KeySet<
      Depth,
      L.Length<KeyFuncs>
    >
      ? Node<
          Datum,
          KeyFuncs,
          Params['depth'],
          N.Sub<KeyFuncs['length'], Params['depth']>
        >
      : IsNever<DimKey> extends true
        ? never
        : Node<Datum, KeyFuncs, DimKey, N.Sub<KeyFuncs['length'], DimKey>>
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
    this: Node<Datum, KeyFuncs, Depth>,
    callback: (
      node: DescendantIter<Node<Datum, KeyFuncs, Depth>>,
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
    this: Node<Datum, KeyFuncs, Depth>,
    callback: (
      node: DescendantIter<Node<Datum, KeyFuncs, Depth>>,
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
    this: Node<Datum, KeyFuncs, Depth>,
    callback: (
      node: DescendantIter<Node<Datum, KeyFuncs, Depth>>,
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
    this: Node<Datum, KeyFuncs, Depth>,
    callback: (
      node: DescendantIter<Node<Datum, KeyFuncs, Depth>>,
      index?: number
    ) => boolean
  ): this | undefined {
    for (const node of this) {
      const test = callback(node)

      if (test)
        return node
    }
  }

  isRoot(): this is Node<Datum, KeyFuncs, 0> {
    return this?.depth === 0
  }

  isLeaf(): this is Node<Datum, KeyFuncs, L.Length<KeyFuncs>> {
    return this?.height === 0
  }

  /**
   * @description Returns the array of leaf nodes for this node
   *
   * @see {@link https://github.com/d3/d3-hierarchy#leaves}
   */
  leaves(this: Node<Datum, KeyFuncs, Depth>): Array<Node<Datum, KeyFuncs, L.Length<KeyFuncs>>> {
    const leaves = [] as unknown as Array<
      Node<Datum, KeyFuncs, L.Length<KeyFuncs>>
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
  links(this: Node<Datum, KeyFuncs, Depth>) {
    const links = [] as Array<
      {
        [Key in L.KeySet<Depth, L.Length<KeyFuncs>>]: {
          source: Key extends 0
            ? undefined
            : Simplify<
                Node<Datum, KeyFuncs, Key, N.Sub<L.Length<KeyFuncs>, Key>>
              >['parent']
          target: Simplify<
            Node<Datum, KeyFuncs, Key, N.Sub<L.Length<KeyFuncs>, Key>>
          >
        }
      }[L.KeySet<Depth, L.Length<KeyFuncs>>]
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
    this: Node<Datum, KeyFuncs, Depth>,
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
  path(
    this: Node<Datum, KeyFuncs, Depth>,
    end: DescendantIter<Node<Datum, KeyFuncs, 0>>
  ) {
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
    this: Node<Datum, KeyFuncs, Depth>,
    scale?: this['colorScale'],
    scaleBy?: this['colorScaleBy'],
    scaleMode?: this['colorScaleMode'],
    scaleNum?: this['colorScaleNum']
  ): Node<Datum, KeyFuncs, Depth> {
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
  setValueFunction(
    this: Node<Datum, KeyFuncs, Depth>,
    valueFn: this['valueFunction']
  ) {
    this.each(node => (node.valueFunction = valueFn))
    this.setValues()
    return this
  }

  /**
   * Sets the value of this node and its descendants, and returns this node.
   */
  setValues(this: Node<Datum, KeyFuncs, Depth>) {
    this.each((node) => {
      node.value = node.valueFunction(node)
    })
    return this
  }

  toJSON(this: Node<Datum, KeyFuncs, Depth>) {
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
export function createNode<Datum, KeysOf>(keyFns: KeysOf, records: Datum[]) {
  return new Node(
    keyFns,
    records,
    0 as const,
    keyFns.length as N.Sub<L.Length<KeysOf>, 0>,
    undefined
  )
}

// export class LeafNode<
//   Datum,
//   KeyFuncs extends ReadonlyArray<KeyFn<Datum>>
// > extends Node<Datum, KeyFuncs, L.Length<KeyFuncs>, 0> {
//   constructor(
//     public readonly keyFns: KeyFuncs,
//     public readonly records: Datum[],
//     public readonly id: string,
//     public readonly depth = keyFns.length as L.Length<KeyFuncs>,
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
//   KeyFuncs extends ReadonlyArray<KeyFn<Datum>>
// > extends Node<Datum, KeyFuncs, 0, L.Length<KeyFuncs>> {
//   constructor(
//     public readonly keyFns: KeyFuncs,
//     public readonly records: Datum[],
//     public readonly id = undefined,
//     public readonly depth = 0 as const,
//     public readonly height = keyFns.length as L.Length<KeyFuncs>
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
