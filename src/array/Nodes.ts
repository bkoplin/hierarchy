import {
  filterObject, length, pipe, prop, uniq, zipObj,
} from 'rambdax'
import type {
  ConditionalExcept,
  FixedLengthArray,
  IterableElement,
  JsonObject,
  LiteralUnion,
  RequireExactlyOne,
} from 'type-fest'
import type {
  ChromaStatic, Color,
} from 'chroma-js'
import chroma from 'chroma-js'
import type {
  I, L, N,
} from 'ts-toolbelt'
import {
  get, isArray,
} from 'lodash-es'
import type {
  DepthFromDim,
  GetDatumFromKeyFn,
  GetDims,
  GetIdFromKey,
  GetKeyFn,
  KeyFn,
  KeyFnTuple,
  NodeArray,
  NodeLinks,
} from './types'

function isTupleKeyFn<Datum>(keyFn: unknown | KeyFnTuple<Datum>): keyFn is KeyFnTuple<Datum> {
  return (
    isArray(keyFn) &&
    typeof keyFn !== 'string' &&
    typeof keyFn !== 'number' &&
    typeof keyFn !== 'symbol'
  )
}

function getKeyFunc<KeyFunctions extends readonly any[], D extends number>(
  keyFns: KeyFunctions,
  depth: D
): GetKeyFn<KeyFunctions, D> {
  type Datum = GetDatumFromKeyFn<KeyFunctions[N.Sub<D, 1>]>
  const keyFn = keyFns[depth - 1]

  if (typeof keyFn === 'undefined') { return () => undefined }

  else if (isTupleKeyFn<Datum>(keyFn)) { return keyFn[1] }

  else {
    return (obj: Datum) => get(
      obj,
      keyFn as unknown as keyof Datum
    )
  }
}

export class Node<
  Datum extends JsonObject | string,
  KeyFuncs extends FixedLengthArray<
    KeyFn<Datum>,
    L.KeySet<1, 12>
  > = FixedLengthArray<KeyFn<Datum>, 2>,
  Depth extends LiteralUnion<L.KeySet<0, KeyFuncs['length']>, number> = 0,
  Height extends LiteralUnion<N.Sub<KeyFuncs['length'], Depth>, number> = N.Sub<
    KeyFuncs['length'],
    Depth
  >
> {
  constructor(
    public keyFns: KeyFuncs,
    public records: Datum[],
    public depth: Depth,
    id?: any
  ) {
    const dims: GetDims<KeyFuncs> = [ undefined, ]

    this.height = (keyFns.length - depth) as Height
    keyFns.forEach((keyFn) => {
      if (isTupleKeyFn<Datum>(keyFn))
        dims.push(keyFn[0])
      else dims.push(keyFn)
    })

    this.id = id
    this.dims = dims

    this.dim = this.dims[this.depth]
    this.keyFn = getKeyFunc(
      keyFns,
      depth
    )

    if (depth === 0)
      delete this.parent
    if (depth === keyFns.length)
      delete this.children
    this.type = 'node' as unknown as (typeof this)['type']
    this.name = id
    this.value = records.length
    this.colorScaleNum = records.length
    if (depth === 0)
      this.type = 'root' as unknown as (typeof this)['type']
    else if (depth > 0 && this.height === 0)
      this.type = 'leaf' as unknown as (typeof this)['type']
  }

  children = [] as unknown as Height extends 0
    ? undefined
    : Depth extends KeyFuncs['length']
      ? undefined
      : Array<Node<Datum, KeyFuncs, N.Add<Depth, 1>, N.Sub<Height, 1>>>

  color = '#cccccc'
  colorScale:
  | LiteralUnion<keyof ChromaStatic['brewer'], string>
  | Array<string | Color> = 'Spectral'

  colorScaleBy:
  | 'parentListIds'
  | 'allNodesAtDimIds'
  | 'parentListValues'
  | 'allNodesAtDimValues' = 'allNodesAtDimIds'

  colorScaleMode: 'e' | 'q' | 'l' | 'k' = 'e'
  colorScaleNum: number
  dim: GetDims<KeyFuncs>[Depth]

  dims: GetDims<KeyFuncs>

  height: Height
  id: GetIdFromKey<KeyFuncs[N.Sub<Depth, 1>]>

  keyFn: GetKeyFn<KeyFuncs, Depth>

  name: GetIdFromKey<KeyFuncs[N.Sub<Depth, 1>]>

  parent = undefined as Depth extends 0
    ? undefined
    : Node<Datum, KeyFuncs, N.Sub<Depth, 1>, N.Add<Height, 1>>

  type: Depth extends 0 ? 'root' : Height extends 0 ? 'leaf' : 'node'

  value: number

  /**
   * The function to set the value of the node
   * @default pipe(prop('records'), length)
   */
  valueFunction = pipe<
    [Node<Datum, KeyFuncs, Depth, Height>],
    Node<Datum, KeyFuncs, Depth, Height>['records'],
    number
  >(
    prop('records'),
    length
  );

  *[Symbol.iterator]<
    T extends Node<Datum, KeyFuncs, Depth, Height>
  >(): Generator<IterableElement<NodeArray<T>>, void, unknown> {
    let node = this
    let current: NodeArray<T>
    let next = [ node, ] as unknown as NodeArray<T>
    let children
    let i
    let n

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

  addChild(child: Height extends 0
    ? never
    : Node<Datum, KeyFuncs, N.Add<Depth, 1>, N.Sub<Height, 1>>) {
    if (this.height !== 0)
      this.children!.push(child)
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
    T extends Node<Datum, KeyFuncs, Depth, Height>,
    Param extends RequireExactlyOne<
      {
        depth: L.KeySet<0, Depth>
        dim: L.Take<GetDims<KeyFuncs>, Depth>
      },
      'depth' | 'dim'
    >
  >(
    this: T,
    depthOrDim: Param
  ): Param extends { depth: undefined; dim: undefined }
      ? never
      : Param extends { depth: L.KeySet<0, Depth> }
        ? Node<Datum, KeyFuncs, Param['depth']>
        : Param extends { dim: Param['dim'] } ? Node<Datum, KeyFuncs, DepthFromDim<T, Param['dim']>> : never {
    let node = this
    let test = false

    while (test === false && typeof node !== 'undefined') {
      test = node.dim === depthOrDim.dim || node.depth === depthOrDim.depth
      node = node.parent
    }

    return node
  }

  /**
   * @description Returns the array of ancestors nodes, starting with this node, then followed by each parent up to the root.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#ancestors}
   * @see {ancestorAt}
   */
  ancestors<T extends Node<Datum, KeyFuncs, Depth, Height>>(this: T) {
    const nodes: NodeArray<T, 'a'> = []

    nodes.push(this)
    let node = this

    while (
      typeof node !== 'undefined' &&
      'parent' in node &&
      typeof node.parent !== 'undefined'
    ) {
      nodes.push(parent)
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
  descendants<T extends Node<Datum, KeyFuncs, Depth, Height>>(this: T) {
    return Array.from(this)
  }

  descendantsAt<
    T extends Node<Datum, KeyFuncs, Depth, Height>,
    Param extends RequireExactlyOne<
      {
        depth: L.KeySet<Depth, KeyFuncs['length']>
        dim: GetDims<KeyFuncs>[L.KeySet<Depth, KeyFuncs['length']>]
      },
      'depth' | 'dim'
    >
  >(
    this: T,
    depthOrDim: Param
  ): Param extends { depth: L.KeySet<Depth, KeyFuncs['length']> }
      ? Array<Node<Datum, KeyFuncs, Param['depth']>>
      : Param extends { dim: undefined }
        ? never
        : Array<Node<Datum, KeyFuncs, DepthFromDim<T, Param['dim'], 'd'>>> {
    return this.descendants().filter((node) => {
      if (typeof depthOrDim.depth === 'number')
        return node.depth === depthOrDim.depth
      else return node.dim === depthOrDim.dim
    })
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
  each<T extends Node<Datum, KeyFuncs, Depth, Height>>(
    this: T,
    callback: (node: IterableElement<T>, index?: number) => void
  ): T {
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
  eachAfter<T extends Node<Datum, KeyFuncs, Depth, Height>>(
    this: T,
    callback: (node: IterableElement<T>, index?: number) => void
  ): T {
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
  eachBefore<T extends Node<Datum, KeyFuncs, Depth, Height>>(
    this: T,
    callback: (node: IterableElement<T>, index?: number) => void
  ): T {
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
  find<T extends Node<Datum, KeyFuncs, Depth, Height>>(
    this: T,
    callback: (node: IterableElement<T>, index?: number) => boolean
  ): this | undefined {
    let index = -1

    for (const node of this) {
      if (callback(
        node,
        ++index
      ))
        return node
    }
  }

  hasChildren<T extends Node<Datum, KeyFuncs, Depth, Height>>(this: T | unknown): this is Height extends 0 ? never : T {
    return this?.height > 0
  }

  hasParent<T extends Node<Datum, KeyFuncs, Depth, Height>>(this: T | unknown): this is Depth extends 0 ? never : T {
    return this?.depth > 0
  }

  /**
   * @description Returns the array of leaf nodes for this node
   *
   * @see {@link https://github.com/d3/d3-hierarchy#leaves}
   */
  leaves<T extends Node<Datum, KeyFuncs, Depth, Height>>(this: T): Array<Node<Datum, KeyFuncs, KeyFuncs['length'], 0>> {
    const leaves = []

    this.eachBefore((node) => {
      if (node.height === 0)
        leaves.push(node)
    })
    return leaves
  }

  /**
   * Returns an array of links for this node and its descendants, where each *link* is an object that defines source and target properties. The source of each link is the parent node, and the target is a child node.
   * @see {@link https://github.com/d3/d3-hierarchy#links}
   * @see {@link path}
   */
  links<T extends Node<Datum, KeyFuncs, Depth, Height>>(this: T): NodeLinks<T> {
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
  path<ThisNode extends this, EndNode extends { depth: number }>(
    this: ThisNode,
    end: EndNode
  ) {
    type ReturnPath<
      ThisIter extends I.Iteration = I.IterationOf<ThisNode['depth']>,
      EndIter extends I.Iteration = I.IterationOf<0>,
      PathArray extends L.List = []
    > = {
      0: {
        0: PathArray
        1: ReturnPath<
          ThisIter,
          I.Next<EndIter>,
          [
            ...PathArray,
            Node<
              Datum,
              KeyFuncs,
              I.Pos<EndIter>,
              N.Sub<KeyFuncs['length'], I.Pos<EndIter>>
            >
          ]
        >
      }[N.LowerEq<I.Pos<EndIter>, EndNode['depth']>]
      1: ReturnPath<
        I.Prev<ThisIter>,
        EndIter,
        [
          ...PathArray,
          Node<
            Datum,
            KeyFuncs,
            I.Pos<ThisIter>,
            N.Sub<KeyFuncs['length'], I.Pos<ThisIter>>
          >
        ]
      >
    }[N.Greater<I.Pos<ThisIter>, 0>]
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
    return nodes as unknown as ReturnPath
  }

  setColor<T extends Node<Datum, KeyFuncs, Depth, Height>>(
    this: T,
    scale?: T['colorScale'],
    scaleBy?: T['colorScaleBy'],
    scaleMode?: T['colorScaleMode'],
    scaleNum?: T['colorScaleNum']
  ): T {
    return this.each((node) => {
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
    })
  }

  /**
   * Sets the value function for this node and its descendants, sets the values based on the value function, and returns this node.
   * @param valueFn a function that receives a node and returns a numeric value
   */
  setValueFunction(valueFn: this['valueFunction']) {
    this.each(node => (node.valueFunction = valueFn))
    this.setValues()
    return this
  }

  /**
   * Sets the value of this node and its descendants, and returns this node.
   */
  setValues<T extends Node<Datum, KeyFuncs, Depth, Height>>(this: T) {
    this.each((node) => {
      node.value = node.valueFunction(node)
    })
    return this
  }

  toJSON<T extends Node<Datum, KeyFuncs, Depth, Height>>(this: T) {
    const node = filterObject(
      v => v !== undefined && typeof v !== 'function',
      this
    )

    delete node.parent
    // if (node.height === 0)
    //   delete node.children
    return node as unknown as ConditionalExcept<
      Omit<T, 'parent'>,
      undefined | ((...args: any[]) => any)
    >
  }
}

function leastCommonAncestor(a, b) {
  if (a === b)
    return a
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
