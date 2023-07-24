import { always, filterObject, uniq, zipObj } from 'rambdax'
import type {
  ConditionalExcept,
  Get,
  IterableElement,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  LiteralUnion,
  RequireExactlyOne,
  Writable,
} from 'type-fest'
import type { ChromaStatic, Color } from 'chroma-js'
import chroma from 'chroma-js'
import type { A, L, N, B, O, I } from 'ts-toolbelt'
import { get, isArray, noop } from 'lodash-es'
import type {
  AncestorArray,
  AncestorFromDim,
  // DescendantArray,
  DescendantFromDim,
  GetDims,
  GetIdFromKey,
  KeyFn,
  KeyFnKey,
  KeyFnTuple,
} from './types'

function isTupleKeyFn<Datum>(
  keyFn: unknown | KeyFnTuple<Datum>
): keyFn is KeyFnTuple<Datum> {
  const [dim, fn] = keyFn as KeyFnTuple<Datum>
  return typeof fn === 'function' && typeof dim === 'string'
}
function isKeyofKeyFn<Datum>(keyFn: unknown): keyFn is KeyFnKey<Datum> {
  return (
    typeof keyFn === 'string' ||
    typeof keyFn === 'number' ||
    typeof keyFn === 'symbol'
  )
}

export class LeafNode<
  Datum = any,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>> = readonly [KeyFn<Datum>],
  Depth extends LiteralUnion<KeyFuncs['length'], number> = KeyFuncs['length']
> {
  constructor(
    keyFns: KeyFuncs,
    public records: Datum[],
    public depth: Depth,
    public id: string
  ) {
    this.height = keyFns.length
    this.name = id
    this.keyFns = [undefined, ...keyFns]
    this.value = records.length
    this.colorScaleNum = records.length
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
  height: LiteralUnion<0, number> = 0
  keyFns: L.Prepend<KeyFuncs, undefined>
  name: string
  _parent = {} as unknown as N.Greater<Depth, 0> extends 1
    ? Depth extends 1
      ? RootNode<Datum, KeyFuncs, 0, KeyFuncs['length']>
      : Node<Datum, KeyFuncs, N.Sub<KeyFuncs['length'], 1>, 1>
    : never
  value: number

  /**
   * The function to set the value of the node
   * @default
   * pipe(prop('records'), length)
   */
  valueFunction = (rec: this) => rec.records.length

  get dim(): GetDims<KeyFuncs>[this['depth']] {
    return this.dims[this.depth]
  }

  get keyFn() {
    const { keyFns, depth } = this
    const keyFn = keyFns[depth]
    if (depth === 0 || typeof keyFn === 'undefined') return () => undefined
    else if (
      typeof keyFn === 'string' ||
      typeof keyFn === 'number' ||
      typeof keyFn === 'symbol'
    )
      return (obj: Datum) => get(obj, keyFn)
    else {
      return (keyFn as KeyFnTuple<Datum>)[1]
    }
  }
  get dims(): GetDims<KeyFuncs> {
    return this.keyFns.reduce((acc, keyFn) => {
      if (typeof keyFn === 'undefined') acc.push(undefined)
      else {
        const [dim, fn] = keyFn
        if (typeof fn === 'function') acc.push(dim)
        else if (typeof keyFn !== 'undefined') acc.push(keyFn)
      }
      return acc
    }, []) as unknown as GetDims<KeyFuncs>
  }

  get parent() {
    return this._parent
  }

  set parent(parent) {
    this._parent = parent
  }

  get type() {
    return 'leaf' as const
  }

  *[Symbol.iterator]() {
    yield this
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
        dim: L.UnionOf<GetDims<KeyFuncs, 1, Depth>>
      },
      'depth' | 'dim'
    >
  >(depthOrDim: Params) {
    type ReturnNode = {
      1: never
      0: {
        0: {
          0: never
          1: AncestorFromDim<Node<Datum, KeyFuncs, Depth>, Params['dim']>
        }[L.Includes<GetDims<KeyFuncs>, Params['dim'], '<-contains'>]
        1: Node<Datum, KeyFuncs, Params['depth']>
      }[A.Contains<Params['depth'], L.KeySet<Depth, KeyFuncs['length']>>]
    }[B.And<
      B.Not<O.Has<Params, 'depth', undefined>>,
      B.Not<O.Has<Params, 'dim', undefined>>
    >]

    return this.ancestors().find((node) => {
      if (typeof depthOrDim.depth === 'number')
        return node.depth === depthOrDim.depth
      else return node.dim === depthOrDim.dim
    }) as unknown as ReturnNode
  }

  /**
   * @description Returns the array of ancestors nodes, starting with this node, then followed by each parent up to the root.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#ancestors}
   * @see {ancestorAt}
   */
  ancestors(): AncestorArray<this> {
    const nodes: AncestorArray<this> = [this]
    let node = this

    while (
      typeof node !== 'undefined' &&
      'parent' in node &&
      typeof node._parent !== 'undefined'
    ) {
      nodes.push(node.parent)
      node = node.parent
    }

    return nodes
  }

  /**
   * @description Returns the array of descendant nodes, starting with this node.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#descendants}
   * @see {@link ancestors}
   */
  descendants() {
    return Array.from(this)
  }

  descendantsAt<
    Params extends RequireExactlyOne<
      {
        depth: L.KeySet<Depth, KeyFuncs['length']>
        dim: L.UnionOf<GetDims<KeyFuncs, Depth>>
      },
      'depth' | 'dim'
    >
  >(this: Node<Datum, KeyFuncs, Depth>, depthOrDim: Params) {
    type ReturnNodes = {
      1: never
      0: {
        0: {
          0: never
          1: L.Filter<
            DescendantArray<Node<Datum, KeyFuncs, Depth>>,
            { dim: Params['dim'] },
            '<-contains'
          >
        }[L.Includes<GetDims<KeyFuncs>, Params['dim'], '<-contains'>]
        1: Array<Node<Datum, KeyFuncs, Params['depth']>>
      }[A.Contains<Params['depth'], L.KeySet<Depth, KeyFuncs['length']>>]
    }[B.And<
      B.Not<O.Has<Params, 'depth', undefined>>,
      B.Not<O.Has<Params, 'dim', undefined>>
    >]
    return this.descendants().filter((node) => {
      if (typeof depthOrDim.depth === 'number')
        return node.depth === depthOrDim.depth
      else return node.dim === depthOrDim.dim
    }) as unknown as ReturnNodes
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
  each<T extends Node<Datum, KeyFuncs, Depth>>(
    this: T,
    callback: (node: IterableElement<T>, index?: number) => void
  ): T {
    let index = -1

    for (const node of this) {
      callback(node, ++index)
    }

    return this
  }

  /**
   * Invokes the specified function for node and each descendant in post-order traversal,
   * such that a given node is only visited after all of its descendants have already been
   * visited. The specified function is passed the current descendant, the zero-based traversal
   * index, and this node. If that is specified, it is the this context of the callback.
   */
  eachAfter<T extends Node<Datum, KeyFuncs, Depth>>(
    this: T,
    callback: (node: IterableElement<T>, index?: number) => void
  ): T {
    const nodes = [this]
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
      callback(node, ++index)
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
  eachBefore<T extends Node<Datum, KeyFuncs, Depth>>(
    this: T,
    callback: (node: IterableElement<T>, index?: number) => void
  ): T {
    const nodes = [this]
    let children
    let i
    let index = -1
    let node

    while ((node = nodes.pop()) !== undefined) {
      callback(node, ++index)
      if ((children = node?.children) !== undefined)
        for (i = children.length - 1; i >= 0; --i) nodes.push(children[i])
    }
    return this
  }

  /**
   * Returns the first node in the hierarchy from this node for which the specified filter returns a truthy value. undefined if no such node is found.
   * @see {@link https://github.com/d3/d3-hierarchy#find}
   */
  find<T extends Node<Datum, KeyFuncs, Depth>>(
    this: T,
    callback: (node: IterableElement<T>, index?: number) => boolean
  ): IterableElement<T> | undefined {
    for (const node of this) {
      if (callback(node, ++index)) return node
    }
  }

  hasChildren(): this is Depth extends KeyFuncs['length'] ? never : this {
    return this?.height > 0
  }

  hasParent(): this is Depth extends 0 ? never : this {
    return this?.depth > 0
  }

  /**
   * @description Returns the array of leaf nodes for this node
   *
   * @see {@link https://github.com/d3/d3-hierarchy#leaves}
   */
  leaves(this: this): Array<Node<Datum, KeyFuncs, KeyFuncs['length']>> {
    const leaves = []

    this.eachBefore((node) => {
      if (node.height === 0) leaves.push(node)
    })
    return leaves
  }

  /**
   * Returns an array of links for this node and its descendants, where each *link* is an object that defines source and target properties. The source of each link is the parent node, and the target is a child node.
   * @see {@link https://github.com/d3/d3-hierarchy#links}
   * @see {@link path}
   */
  links(this: this) {
    const links = []

    this.each((node) => {
      if (node !== this) {
        // Don't include the root's parent, if any.
        links.push({
          source: node.parent,
          target: node,
        })
      }
    })
    return links
  }

  /**
   * @description Returns the shortest path through the hierarchy from this node to the specified target node. The path starts at this node, ascends to the least common ancestor of this node and the target node, and then descends to the target node. This is particularly useful for hierarchical edge bundling.
   * @see {@link https://github.com/d3/d3-hierarchy#node_path}
   * @see {@link links}
   */
  path() {
    let start = this
    const ancestor = leastCommonAncestor(start, end)
    const nodes = [start]

    while (start !== ancestor) {
      start = start.parent
      nodes.push(start)
    }
    const k = nodes.length

    while (end !== ancestor) {
      nodes.splice(k, 0, end)
      end = end.parent
    }
    return nodes
  }

  setColor(
    scale?: this['colorScale'],
    scaleBy?: this['colorScaleBy'],
    scaleMode?: this['colorScaleMode'],
    scaleNum?: this['colorScaleNum']
  ): this {
    return this.each((node) => {
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
          const ancestor = node.ancestorAt({ depth: 0 })

          values = uniq(
            ancestor
              .descendants()
              .filter((d) => d.dim === node.dim)
              .map((n) => n.id)
          )
        }
        node.color = zipObj(
          values,
          chroma.scale(node.colorScale).colors(values.length)
        )[node.id]
      } else if (node.hasParent()) {
        let values: number[] = node.parent!.children!.map((n) => n.value)

        if (node.colorScaleBy === 'allNodesAtDimValues') {
          const ancestor = node.ancestorAt({ depth: 0 })

          values = uniq(
            ancestor
              .descendants()
              .filter((d) => d.dim === node.dim)
              .map((n) => n.value)
          )
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
    })
  }

  /**
   * Sets the value function for this node and its descendants, sets the values based on the value function, and returns this node.
   * @param valueFn a function that receives a node and returns a numeric value
   */
  setValueFunction(valueFn: this['valueFunction']) {
    this.each((node) => (node.valueFunction = valueFn))
    this.setValues()
    return this
  }

  /**
   * Sets the value of this node and its descendants, and returns this node.
   */
  setValues() {
    this.each((node) => {
      node.value = node.valueFunction(node)
    })
    return this
  }

  toJSON(this: Node<Datum, KeyFuncs, Depth>) {
    const node = filterObject<ConditionalExcept<this, undefined | Function>>(
      (v): v is JsonValue => v !== undefined && typeof v !== 'function',
      this
    )

    // if (node.height === 0)
    //   delete node.children
    return node
  }
}

export class Node<
  Datum,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>>,
  Depth extends number,
  Height extends number
> extends LeafNode<Datum, KeyFuncs> {
  constructor(
    keyFns: KeyFuncs,
    records: Datum[],
    public depth: Depth,
    public height: Height,
    public id: string
  ) {
    super(keyFns, records, depth, id as unknown as string)
  }
  _children = [] as unknown as N.Greater<Height, 0> extends 1
    ? Height extends 1
      ? LeafNode<Datum, KeyFuncs, KeyFuncs['length']>[]
      : Node<Datum, KeyFuncs, N.Add<Depth, 1>, N.Sub<Height, 1>>[]
    : undefined[]

  addChild(
    child: N.Greater<Height, 0> extends 1
      ? Height extends 1
        ? LeafNode<Datum, KeyFuncs, KeyFuncs['length']>
        : Node<Datum, KeyFuncs, N.Sub<Depth, 1>, N.Sub<Height, 1>>
      : never
  ) {
    if (this.height !== 0 && child) this._children.push(child)
  }

  get children() {
    return this._children
  }

  set children(children) {
    this._children = children
  }
  get type() {
    return 'node' as const
  }
}
export class RootNode<
  Datum,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>>,
  Depth extends LiteralUnion<0, number> = 0,
  Height extends KeyFuncs['length'] = KeyFuncs['length']
> extends Node<Datum, KeyFuncs, Depth, Height> {
  constructor(keyFns: KeyFuncs, records: Datum[]) {
    super(
      keyFns,
      records,
      0 as unknown as Depth,
      keyFns.length as unknown as Height,
      undefined as unknown as string
    )
  }
  get type() {
    return 'root' as const
  }
}

function leastCommonAncestor(a, b) {
  if (a === b) return a
  const aNodes = a.ancestors()
  const bNodes = b.ancestors()
  let c = null

  a = aNodes.pop()
  b = bNodes.pop()
  while (a === b) {
    c = a
    a = aNodes.pop()
    b = bNodes.pop()
  }
  return c
}
