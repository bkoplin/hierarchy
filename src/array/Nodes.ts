import {
  filterObject,
  uniq,
  zipObj,
  anyPass,
  is,
  equals,
  intersection,
} from 'rambdax'
import type {
  ConditionalExcept,
  IsNever,
  IterableElement,
  JsonValue,
  Simplify,
  LiteralUnion,
  RequireExactlyOne,
} from 'type-fest'
import type {
  ChromaStatic, Color, 
} from 'chroma-js'
import chroma from 'chroma-js'
import type {
  L, N, B, 
} from 'ts-toolbelt'
import type {
  AncestorArray,
  IndexOfElement,
  GetDimOptions,
  // DescendantFromDim,
  GetDims,
  KeyFn,
  KeyFnKey,
  KeyFnTuple,
  GetDimOptions,
} from './types.d'

type ChildType<
  Datum,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>>,
  Depth extends L.KeySet<0, KeyFuncs['length']>,
  Height extends L.KeySet<0, KeyFuncs['length']>
> = B.And<N.Greater<Height, 0>, N.Lower<Depth, L.Length<KeyFuncs>>> extends 1
  ? Height extends 1
    ? LeafNode<Datum, KeyFuncs>
    : Node<Datum, KeyFuncs, N.Add<Depth, 1>, N.Sub<Height, 1>>
  : never

type ParentType<
  Datum,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>>,
  Depth extends L.KeySet<0, KeyFuncs['length']>
> = Depth extends 0
  ? never
  : Depth extends 1
  ? RootNode<Datum, KeyFuncs>
  : Node<
      Datum,
      KeyFuncs,
      N.Sub<Depth, 1>,
      N.Sub<L.Length<KeyFuncs>, N.Sub<Depth, 1>>
    >

export class Node<
  Datum = string,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>> = readonly [
    KeyFn<Datum>,
    KeyFn<Datum>
  ],
  Depth extends L.KeySet<0, KeyFuncs['length']> = L.KeySet<
    0,
    KeyFuncs['length']
  >,
  Height extends L.KeySet<0, KeyFuncs['length']> = N.Sub<
    L.Length<KeyFuncs>,
    Depth
  >
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
        if (acc.length === 0) acc.push(undefined)
        if (isKeyofKeyFn(keyFn)) acc.push(keyFn)
        else if (isTupleKeyFn(keyFn)) {
          const [
            dim,
            fn, 
          ] = keyFn

          if (typeof fn === 'function') acc.push(dim)
        }
        return acc
      },
      []
    ) as unknown as GetDims<KeyFuncs>
    this.dim = this.dims[depth] as unknown as GetDimOptions<KeyFuncs, Depth, Depth>

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
  dim: GetDimOptions<KeyFuncs, Depth, Depth>
  dims: GetDims<KeyFuncs>
  name: this['id']
  #parent = undefined as unknown as ParentType<Datum, KeyFuncs, Depth>

  value: number

  children: Array<ChildType<Datum, KeyFuncs, Depth, Height>> = []

  addChild(
    this: Node<Datum, KeyFuncs, Depth, Height>,
    child: ChildType<Datum, KeyFuncs, Depth, Height>
  ) {
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
      ? `root`
      : this[`height`] extends 0
      ? `leaf`
      : `node`
    if (this.depth === 0) return `leaf` as ReturnType
    else if (this.height === 0) return `root` as ReturnType
    else return `node` as ReturnType
  }

  *[Symbol.iterator](): Generator<
    Node<Datum, KeyFuncs, L.KeySet<Depth, L.Length<KeyFuncs>>>,
    void,
    unknown
    > {
    let node = this
    let current: Array<
      Node<Datum, KeyFuncs, L.KeySet<Depth, L.Length<KeyFuncs>>>
    >
    let next = [ node, ] as unknown as Array<
      Node<Datum, KeyFuncs, L.KeySet<Depth, L.Length<KeyFuncs>>>
    >
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
    Depths extends L.KeySet<0, Depth>,
    Params extends RequireExactlyOne<
      {
        depth: Depths
        dim: GetDimOptions<KeyFuncs, 0, Depth>
      },
      'depth' | 'dim'
    >
  >(this: Node<Datum, KeyFuncs, Depth, Height>, depthOrDim: Params) {
    type DimKey = IndexOfElement<GetDims<KeyFuncs>, Params['dim']>

    type ReturnType = Params['depth'] extends Depths
      ? Node<
          Datum,
          KeyFuncs,
          Params['depth'],
          N.Sub<KeyFuncs['length'], Params['depth']>
        >
      : IsNever<DimKey> extends true
      ? never
      : Node<Datum, KeyFuncs, DimKey, N.Sub<L.Length<KeyFuncs>, DimKey>>

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
  ancestors(): AncestorArray<Node<Datum, KeyFuncs, Depth, Height>> {
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
  descendants(this: Node<Datum, KeyFuncs, Depth, Height>) {
    return Array.from(this)
  }

  descendantsAt<
    Depths extends L.KeySet<Depth, KeyFuncs['length']>,
    Params extends RequireExactlyOne<
      {
        depth: Depths
        dim: GetDimOptions<KeyFuncs, Depth>
      },
      'depth' | 'dim'
    >
  >(this: Node<Datum, KeyFuncs, Depth, Height>, depthOrDim: Params) {
    type DimKey = IndexOfElement<GetDims<KeyFuncs>, Params['dim']>

    type ReturnType = Params['depth'] extends number
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

      if (typeof paramDepth === 'number') return node.depth === paramDepth
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
  each(callback: (
      node: IterableElement<Node<Datum, KeyFuncs, Depth, Height>>,
      index?: number
    ) => void): Node<Datum, KeyFuncs, Depth, Height> {
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
  eachAfter(callback: (
      node: IterableElement<Node<Datum, KeyFuncs, Depth, Height>>,
      index?: number
    ) => void): Node<Datum, KeyFuncs, Depth, Height> {
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
  eachBefore(callback: (
      node: IterableElement<Node<Datum, KeyFuncs, Depth, Height>>,
      index?: number
    ) => void): Node<Datum, KeyFuncs, Depth, Height> {
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
  find(callback: (
      node: IterableElement<Node<Datum, KeyFuncs, Depth, Height>>,
      index?: number
    ) => boolean): Node<Datum, KeyFuncs, Depth, Height> | undefined {
    for (const node of this) {
      const test = callback(node)

      if (test) return node
    }
  }

  hasChildren(): this is Depth extends KeyFuncs['length']
    ? LeafNode<Datum, KeyFuncs>
    : Node<Datum, KeyFuncs, Depth, Height> {
    return this?.height > 0
  }

  hasParent(): this is Depth extends 0
    ? RootNode<Datum, KeyFuncs>
    : Node<Datum, KeyFuncs, Depth, Height> {
    return this?.depth > 0
  }

  /**
   * @description Returns the array of leaf nodes for this node
   *
   * @see {@link https://github.com/d3/d3-hierarchy#leaves}
   */
  leaves(this: Node<Datum, KeyFuncs, Depth, Height>): Array<LeafNode<Datum, KeyFuncs>> {
    const leaves = [] as unknown as Array<LeafNode<Datum, KeyFuncs>>

    this.eachBefore((node) => {
      if (!node.height) {
        leaves.push(node)
      }
    })
    return leaves
  }

  /**
   * Returns an array of links for this node and its descendants, where each *link* is an object that defines source and target properties. The source of each link is the parent node, and the target is a child node.
   * @see {@link https://github.com/d3/d3-hierarchy#links}
   * @see {@link path}
   */
  links(this: Node<Datum, KeyFuncs, Depth, Height>) {
    const links = [] as Array<
      {
        [Key in L.KeySet<Depth, L.Length<KeyFuncs>>]: {
          source: Key extends 0 ? undefined : Simplify<Node<Datum, KeyFuncs, Key, N.Sub<L.Length<KeyFuncs>, Key>>>['parent']
          target: Simplify<Node<Datum, KeyFuncs, Key, N.Sub<L.Length<KeyFuncs>, Key>>>
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

  /**
   * @description Returns the shortest path through the hierarchy from this node to the specified target node. The path starts at this node, ascends to the least common ancestor of this node and the target node, and then descends to the target node. This is particularly useful for hierarchical edge bundling.
   * @see {@link https://github.com/d3/d3-hierarchy#node_path}
   * @see {@link links}
   */
  path(this: Node<Datum, KeyFuncs, Depth, Height>, end: Node<Datum, KeyFuncs>) {
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
    this: Node<Datum, KeyFuncs, Depth, Height>,
    scale?: this['colorScale'],
    scaleBy?: this['colorScaleBy'],
    scaleMode?: this['colorScaleMode'],
    scaleNum?: this['colorScaleNum']
  ): Node<Datum, KeyFuncs, Depth, Height> {
    this.each((node) => {
      if (typeof node === 'undefined' || node === null) return
      else {
        if (typeof scaleBy !== 'undefined') node.colorScaleBy = scaleBy
        if (typeof scale !== 'undefined') node.colorScale = scale
        if (typeof scaleMode !== 'undefined') node.colorScaleMode = scaleMode
        if (typeof scaleNum !== 'undefined') node.colorScaleNum = scaleNum
        if (
          (node.colorScaleBy === 'allNodesAtDimIds' ||
            node.colorScaleBy === 'parentListIds') &&
          node.hasParent()
        ) {
          let values: string[] = node.parent!.children!.map((n) => n.id)

          if (node.colorScaleBy === 'allNodesAtDimIds') {
            const ancestor = node.ancestorAt({ depth: 0, })

            values = uniq(ancestor
              .descendants()
              .filter((d) => d.dim === node.dim)
              .map((n) => n.id))
          }
          node.color = zipObj(
            values,
            chroma.scale(node.colorScale).colors(values.length)
          )[node.id]
        } else if (node.hasParent()) {
          let values: number[] = node.parent!.children!.map((n) => n.value)

          if (node.colorScaleBy === 'allNodesAtDimValues') {
            const ancestor = node.ancestorAt({ depth: 0, })

            values = uniq(ancestor
              .descendants()
              .filter((d) => d.dim === node.dim)
              .map((n) => n.value))
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
    this: Node<Datum, KeyFuncs, Depth, Height>,
    valueFn: Node<Datum, KeyFuncs, Depth, Height>['valueFunction']
  ) {
    this.each((node) => (node.valueFunction = valueFn))
    this.setValues()
    return this
  }

  /**
   * Sets the value of this node and its descendants, and returns this node.
   */
  setValues(this: Node<Datum, KeyFuncs, Depth, Height>) {
    this.each((node) => {
      node.value = node.valueFunction(node)
    })
    return this
  }

  toJSON(this: Node<Datum, KeyFuncs, Depth, Height>) {
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
export class LeafNode<Datum, KeyFuncs extends ReadonlyArray<KeyFn<Datum>>>
  extends Node<Datum, KeyFuncs, L.Length<KeyFuncs>, 0>
  implements Node<Datum, KeyFuncs, L.Length<KeyFuncs>, 0>
{
  constructor(
    readonly keyFns: KeyFuncs,
    readonly records: Datum[],
    readonly id: string,
    readonly depth = keyFns.length as L.Length<KeyFuncs>,
    readonly height = 0 as const
  ) {
    super(
      keyFns,
      records,
      keyFns.length,
      0,
      id
    )
    this.children = undefined
  }


  // declare children: never[]
}
export class RootNode<Datum, KeyFuncs extends ReadonlyArray<KeyFn<Datum>>>
  extends Node<Datum, KeyFuncs, 0, L.Length<KeyFuncs>>
  implements Node<Datum, KeyFuncs, 0, L.Length<KeyFuncs>>
{
  constructor(
    readonly keyFns: KeyFuncs,
    readonly records: Datum[],
    readonly id = undefined,
    readonly depth = 0 as const,
    readonly height = keyFns.length as L.Length<KeyFuncs>
  ) {
    super(
      keyFns,
      records,
      0,
      keyFns.length,
      id
    )
  }


  // #parent = undefined

  // declare #parent: never
}

function leastCommonAncestor<ANode extends Node, BNode extends Node>(
  a: ANode,
  b: BNode
) {
  if (equals(
    a,
    b
  )) return a
  const aNodes = a.ancestors()
  const bNodes = b.ancestors()
  const [ c, ] = intersection(
    aNodes,
    bNodes
  )

  return c ?? null
}
