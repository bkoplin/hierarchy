import { always, filterObject, uniq, zipObj } from 'rambdax'
import type {
  ConditionalExcept,
  ConditionalKeys,
  Get,
  IsNever,
  IterableElement,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  LiteralUnion,
  Merge,
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
  DescendantArray,
  // DescendantArray,
  DescendantFromDim,
  GetDims,
  GetIdFromKey,
  KeyFn,
  KeyFnKey,
  KeyFnTuple,
} from './types'
import { anyPass } from 'rambdax'
import { is } from 'rambdax'

function isTupleKeyFn<Datum>(
  keyFn: unknown | KeyFnTuple<Datum>
): keyFn is KeyFnTuple<Datum> {
  const [dim, fn] = keyFn as KeyFnTuple<Datum>
  return typeof fn === 'function' && typeof dim === 'string'
}

export class Node<
  Datum,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>>,
  Depth extends L.KeySet<0, KeyFuncs['length']>,
  Height extends L.KeySet<0, KeyFuncs['length']>
> {
  constructor(
    public keyFns: KeyFuncs,
    public records: Datum[],
    public depth: Depth,
    public height: Height,
    public id: Depth extends 0 ? undefined : string
  ) {
    this.depth = depth
    this.height = height
    this.name = id
    this.value = records.length
    this.colorScaleNum = records.length
    this.dims = keyFns.reduce((acc, keyFn) => {
      if (acc.length === 0) acc.push(undefined)
      if (isKeyofKeyFn(keyFn)) acc.push(keyFn)
      else if (!isKeyofKeyFn(keyFn)) {
        const [dim, fn] = keyFn as KeyFnTuple<Datum>
        if (typeof fn === 'function') acc.push(dim)
      }
      return acc
    }, []) as unknown as GetDims<KeyFuncs>
    this.dim = this.dims[depth]

    function isKeyofKeyFn(
      keyFn: unknown | KeyFnKey<Datum>
    ): keyFn is KeyFnKey<Datum> {
      return anyPass([is(String), is(Number), is(Symbol)])(keyFn)
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
  dim: GetDims<KeyFuncs>[this['depth']]
  dims: GetDims<KeyFuncs>
  name: this['id']
  _parent = {} as unknown as N.Greater<this['depth'], 0> extends 1
    ? N.Greater<this['depth'], 1> extends 1
      ? Node<Datum, KeyFuncs, N.Sub<this['depth'], 1>, N.Add<this['height'], 1>>
      : RootNode<Datum, KeyFuncs>
    : never
  value: number

  _children: N.Lower<this['depth'], KeyFuncs['length']> extends 1
    ? N.Greater<this['height'], 1> extends 1
      ? Node<
          Datum,
          KeyFuncs,
          N.Add<this['depth'], 1>,
          N.Sub<this['height'], 1>
        >[]
      : LeafNode<Datum, KeyFuncs>[]
    : never[] = []

  // public _parent = {} as unknown as N.Greater<this['depth'], 1> extends 1
  //   ? Node<Datum, KeyFuncs, N.Sub<this['depth'], 1>, N.Add<this['height'], 1>>
  //   : RootNode<Datum, KeyFuncs>

  addChild(child) {
    this._children.push(child)
  }

  get children() {
    return this._children
  }

  set children(children) {
    this._children = children
  }

  /**
   * The function to set the value of the node
   * @default
   * pipe(prop('records'), length)
   */
  valueFunction = (rec: this) => rec.records.length

  // get keyFn() {
  //   const { keyFns, depth } = this
  //   const keyFn = keyFns[depth]
  //   if (depth === 0 || typeof keyFn === 'undefined') return () => undefined
  //   else if (
  //     typeof keyFn === 'string' ||
  //     typeof keyFn === 'number' ||
  //     typeof keyFn === 'symbol'
  //   )
  //     return (obj: Datum) => get(obj, keyFn)
  //   else {
  //     return (keyFn as KeyFnTuple<Datum>)[1]
  //   }
  // }
  get parent() {
    return this._parent
  }

  set parent(parent) {
    this._parent = parent
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
    IterableElement<DescendantArray<Node<Datum, KeyFuncs, Depth, Height>>>,
    void,
    unknown
  > {
    let node = this
    let current
    let next = [node]
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
    Dims extends GetDims<KeyFuncs>,
    Depths extends L.KeySet<0, this['depth']>,
    Params extends RequireExactlyOne<
      {
        depth: Depths
        dim: Dims[Depths]
      },
      'depth' | 'dim'
    >
  >(depthOrDim: Params) {
    type DimKey<
      DimVal,
      Iter extends I.Iteration = I.IterationOf<this['depth']>
    > = {
      0: {
        0: DimKey<DimVal, I.Prev<Iter>>
        1: I.Pos<Iter>
      }[Dims[I.Pos<Iter>] extends DimVal ? 1 : 0]
      1: -1
    }[I.Pos<I.Prev<Iter>> extends -1 ? 1 : 0]
    type ReturnNode = Params['dim'] extends Dims[number]
      ? Node<
          Datum,
          KeyFuncs,
          DimKey<Params['dim']>,
          N.Sub<KeyFuncs['length'], DimKey<Params['dim']>>
        >
      : Params['depth'] extends Depths
      ? Node<
          Datum,
          KeyFuncs,
          Params['depth'],
          N.Sub<KeyFuncs['length'], Params['depth']>
        >
      : never

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
    Dims extends GetDims<KeyFuncs>,
    Depths extends L.KeySet<this['depth'], KeyFuncs['length']>,
    Params extends RequireExactlyOne<
      {
        depth: Depths
        dim: Dims[Depths]
      },
      'depth' | 'dim'
    >
  >(depthOrDim: Params) {
    type DimKey = L.ZipObj<
      GetDims<KeyFuncs, 1, KeyFuncs['length']>,
      N.Range<1, KeyFuncs['length']>
    >
    type ReturnType = DimKey[Params['dim']] extends number
      ? Node<
          Datum,
          KeyFuncs,
          DimKey[Params['dim']],
          N.Sub<KeyFuncs['length'], DimKey[Params['dim']]>
        >[]
      : Params['depth'] extends number
      ? Node<
          Datum,
          KeyFuncs,
          Params['depth'],
          N.Sub<KeyFuncs['length'], Params['depth']>
        >[]
      : never
    return this.descendants().filter((node) => {
      if (typeof depthOrDim.depth === 'number')
        return node.depth === depthOrDim.depth
      else return node.dim === depthOrDim.dim
    }) as unknown as ReturnType
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
    callback: <T extends this>(node: IterableElement<T>, index?: number) => void
  ): this {
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
  eachAfter(
    callback: <T extends this>(node: IterableElement<T>, index?: number) => void
  ): this {
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
  eachBefore<T extends this>(
    callback: (
      node: IterableElement<T>,
      index?: number
    ) => void
  ): this {
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
  find(
    callback: <T extends this>(
      node: IterableElement<T>,
      index?: number
    ) => boolean
  ): this | undefined {
    for (const node of this) {
      if (callback(node, ++index)) return node
    }
  }

  // hasChildren(): this is this['depth'] extends KeyFuncs['length'] ? never : this {
  //   return this?.height > 0
  // }

  // hasParent(): this is this['depth'] extends 0 ? never : this {
  //   return this?.depth > 0
  // }

  /**
   * @description Returns the array of leaf nodes for this node
   *
   * @see {@link https://github.com/d3/d3-hierarchy#leaves}
   */
  leaves(this: this): LeafNode<Datum, KeyFuncs>[] {
    const leaves = []

    this.eachBefore((node) => {
      if (node.height === 0) leaves.push(node)
    })
    return leaves
  }

  // /**
  //  * Returns an array of links for this node and its descendants, where each *link* is an object that defines source and target properties. The source of each link is the parent node, and the target is a child node.
  //  * @see {@link https://github.com/d3/d3-hierarchy#links}
  //  * @see {@link path}
  //  */
  // links(this: this) {
  //   const links = []

  //   this.each((node) => {
  //     if (node !== this) {
  //       // Don't include the root's parent, if any.
  //       links.push({
  //         source: node.parent,
  //         target: node,
  //       })
  //     }
  //   })
  //   return links
  // }

  // /**
  //  * @description Returns the shortest path through the hierarchy from this node to the specified target node. The path starts at this node, ascends to the least common ancestor of this node and the target node, and then descends to the target node. This is particularly useful for hierarchical edge bundling.
  //  * @see {@link https://github.com/d3/d3-hierarchy#node_path}
  //  * @see {@link links}
  //  */
  // path() {
  //   let start = this
  //   const ancestor = leastCommonAncestor(start, end)
  //   const nodes = [start]

  //   while (start !== ancestor) {
  //     start = start.parent
  //     nodes.push(start)
  //   }
  //   const k = nodes.length

  //   while (end !== ancestor) {
  //     nodes.splice(k, 0, end)
  //     end = end.parent
  //   }
  //   return nodes
  // }

  // setColor(
  //   scale?: this['colorScale'],
  //   scaleBy?: this['colorScaleBy'],
  //   scaleMode?: this['colorScaleMode'],
  //   scaleNum?: this['colorScaleNum']
  // ): this {
  //   return this.each((node) => {
  //     if (typeof scaleBy !== 'undefined') node.colorScaleBy = scaleBy
  //     if (typeof scale !== 'undefined') node.colorScale = scale
  //     if (typeof scaleMode !== 'undefined') node.colorScaleMode = scaleMode
  //     if (typeof scaleNum !== 'undefined') node.colorScaleNum = scaleNum
  //     if (
  //       (node.colorScaleBy === 'allNodesAtDimIds' ||
  //         node.colorScaleBy === 'parentListIds') &&
  //       node.hasParent()
  //     ) {
  //       let values: string[] = node.parent!.children!.map((n) => n.id)

  //       if (node.colorScaleBy === 'allNodesAtDimIds') {
  //         const ancestor = node.ancestorAt({ depth: 0 })

  //         values = uniq(
  //           ancestor
  //             .descendants()
  //             .filter((d) => d.dim === node.dim)
  //             .map((n) => n.id)
  //         )
  //       }
  //       node.color = zipObj(
  //         values,
  //         chroma.scale(node.colorScale).colors(values.length)
  //       )[node.id]
  //     } else if (node.hasParent()) {
  //       let values: number[] = node.parent!.children!.map((n) => n.value)

  //       if (node.colorScaleBy === 'allNodesAtDimValues') {
  //         const ancestor = node.ancestorAt({ depth: 0 })

  //         values = uniq(
  //           ancestor
  //             .descendants()
  //             .filter((d) => d.dim === node.dim)
  //             .map((n) => n.value)
  //         )
  //       }
  //       const colorValues = chroma.limits(
  //         values,
  //         node.colorScaleMode,
  //         node.colorScaleNum
  //       )

  //       node.color = chroma
  //         .scale(node.colorScale)
  //         .domain(colorValues)(node.value)
  //         .hex()
  //     }
  //   })
  // }

  // /**
  //  * Sets the value function for this node and its descendants, sets the values based on the value function, and returns this node.
  //  * @param valueFn a function that receives a node and returns a numeric value
  //  */
  // setValueFunction(valueFn: this['valueFunction']) {
  //   this.each((node) => (node.valueFunction = valueFn))
  //   this.setValues()
  //   return this
  // }

  // /**
  //  * Sets the value of this node and its descendants, and returns this node.
  //  */
  // setValues() {
  //   this.each((node) => {
  //     node.value = node.valueFunction(node)
  //   })
  //   return this
  // }

  // toJSON(this: Node<Datum, KeyFuncs, this['depth']>) {
  //   const node = filterObject<ConditionalExcept<this, undefined | Function>>(
  //     (v): v is JsonValue => v !== undefined && typeof v !== 'function',
  //     this
  //   )

  //   // if (node.height === 0)
  //   //   delete node.children
  //   return node
  // }
}

export class LeafNode<
  Datum,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>> = readonly [KeyFn<Datum>]
> extends Node<Datum, KeyFuncs, KeyFuncs['length'], 0> {
  constructor(keyFns: KeyFuncs, records: Datum[], id: string) {
    super(keyFns, records, keyFns.length, 0, id)
  }
}
export class RootNode<
  Datum,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>>
> extends Node<Datum, KeyFuncs, 0, KeyFuncs['length']> implements Node<Datum, KeyFuncs, 0, KeyFuncs['length']> {
  constructor(keyFns: KeyFuncs, records: Datum[]) {
    super(keyFns, records, 0, keyFns.length, undefined)
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
