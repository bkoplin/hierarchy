import {
  filterObject, length, pipe, prop, uniq, zipObj,
} from 'rambdax'
import type {
  ConditionalExcept,
  Get,
  IterableElement,
  LiteralUnion,
  RequireExactlyOne,
  ValueOf,
} from 'type-fest'
import type {
  ChromaStatic, Color,
} from 'chroma-js'
import chroma from 'chroma-js'
import type {
  I, L, N,
} from 'ts-toolbelt'
import type {
  GetDims,
  KeyFn,
  NodeArray,
  NodeArrayKey,
  NodeLinks,
  NumRange,
} from './types'

export class Node<
  Datum = any,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>> = ReadonlyArray<KeyFn<Datum>>,
  Iter extends I.Iteration = I.IterationOf<0>,
  Depth extends number = I.Pos<Iter>
> {
  constructor(
    public keyFns: KeyFuncs,
    public depth: I.Pos<Iter>,
    public records: Datum[],
    id: any
  ) {
    const dims: GetDims<KeyFuncs> = keyFns.reduce(
      (acc, keyFn) => {
        if (acc.length === 0)
          acc.push(undefined)
        if (
          typeof keyFn !== 'string' &&
        typeof keyFn !== 'number' &&
        typeof keyFn !== 'symbol'
        )
          acc.push(keyFn[0])
        else acc.push(keyFn)
        return acc
      },
      [] as unknown as GetDims<KeyFuncs>
    )

    this.id = id
    this.dims = dims

    this.dim = this.dims[this.depth]
    this.keyFn = keyFns[this.depth - 1]
    this.height = keyFns.length - this.depth
    this.parent = undefined as unknown as (typeof this)['parent']
    this.children = undefined as unknown as (typeof this)['children']
    this.type = 'node' as unknown as (typeof this)['type']
    this.name = id
    this.value = records.length
    this.colorScaleNum = records.length
    if (depth === 0)
      this.type = 'root' as unknown as (typeof this)['type']
    else if (depth > 0 && this.height === 0)
      this.type = 'leaf' as unknown as (typeof this)['type']
  }

  children: this extends { depth: KeyFuncs['length'] }
    ? undefined
    : Array<Node<Datum, KeyFuncs, I.Next<Iter>, I.Pos<I.Next<Iter>>>>

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

  dim: GetDims<KeyFuncs>[this['depth']]

  dims: GetDims<KeyFuncs>

  height: LiteralUnion<N.Sub<KeyFuncs['length'], this['depth']>, number>
  id: this extends { depth: 0 }
    ? undefined
    : KeyFuncs[I.Pos<I.Prev<Iter>>] extends Exclude<
        KeyFn<Datum>,
        ValueOf<Datum>
      >
      ? ReturnType<KeyFuncs[I.Pos<I.Prev<Iter>>][1]>
      : Get<Datum, KeyFuncs[I.Pos<I.Prev<Iter>>]>

  keyFn: KeyFuncs[N.Sub<this['depth'], 1>]
  name: this['id']

  parent: this extends { depth: 0 }
    ? undefined
    : Node<Datum, KeyFuncs, I.Prev<Iter>, I.Pos<I.Prev<Iter>>>

  type: this extends { depth: 0 }
    ? 'root'
    : this extends { depth: KeyFuncs['length'] }
      ? 'leaf'
      : 'node'

  value: number

  /**
   * The function to set the value of the node
   * @default pipe(prop('records'), length)
   */
  valueFunction = pipe<[Node<Datum, KeyFuncs, Iter>], Datum[], number>(
    prop('records'),
    length
  );

  *[Symbol.iterator](): Generator<NodeArray<this>[number], void, unknown> {
    let node = this
    let current
    let next = [ node, ]
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

  addChild(child: Node<Datum, KeyFuncs, I.Next<Iter>>) {
    if (typeof this.children === 'undefined')
      this.children = [] as unknown as (typeof this)['children']
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
    ThisNode extends this,
    Param extends RequireExactlyOne<{
      depth: L.UnionOf<N.Range<0, Depth>>
      dim: IterableElement<NodeArray<ThisNode, 'ancestors'>>['dim']
    }>
  >(depthOrDim: Param) {
    type AncestorAt<T> = Param['depth'] extends number
      ? T extends { depth: Param['depth'] }
        ? T
        : T extends { parent: infer Parent }
          ? AncestorAt<Parent>
          : never
      : T extends { dim: Param['dim'] }
        ? T
        : T extends { parent: infer Parent }
          ? AncestorAt<Parent>
          : never
    let node = this
    let test = false

    while (test === false && typeof node !== 'undefined') {
      test = node.dim === depthOrDim.dim || node.depth === depthOrDim.depth
      node = node.parent
    }

    return node as AncestorAt<this>
  }

  /**
   * @description Returns the array of ancestors nodes, starting with this node, then followed by each parent up to the root.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#ancestors}
   * @see {ancestorAt}
   */
  ancestors() {
    const nodes = []

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

    return nodes as unknown as NodeArray<this, 'ancestors'>
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
    ThisNode extends this,
    Param extends RequireExactlyOne<{
      depth: NodeArrayKey<ThisNode, 'depth'>
      dim: NodeArrayKey<ThisNode, 'dim'>
    }>
  >(depthOrDim: Param) {
    type DescendantAt<T> = Param['depth'] extends number
      ? T extends { depth: Param['depth'] }
        ? T
        : T extends { children: Array<infer Child> }
          ? DescendantAt<Child>
          : never
      : T extends { dim: Param['dim'] }
        ? T
        : T extends { children: Array<infer Child> }
          ? DescendantAt<Child>
          : never
    return this.descendants().filter((node) => {
      if (typeof depthOrDim.depth === 'number')
        return node.depth === depthOrDim.depth
      else return node.dim === depthOrDim.dim
    }) as unknown as Array<DescendantAt<this>>
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
  each(callback: (node: IterableElement<this>, index?: number) => void): this {
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
  eachAfter(callback: (node: IterableElement<this>, index?: number) => void): this {
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
  eachBefore(callback: (node: IterableElement<this>, index?: number) => void): this {
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
  find(callback: (node: IterableElement<this>, index?: number) => boolean): this | undefined {
    let index = -1

    for (const node of this) {
      if (callback(
        node,
        ++index
      ))
        return node
    }
  }

  hasChildren(): this is this extends { depth: KeyFuncs['length'] }
    ? never
    : this {
    return this?.height > 0
  }
  // hasChildren(): this is Merge<
  //   Node<Datum, KeyFuncs>,
  //   {
  //     children: Array<
  //       Merge<
  //         Node<Datum, KeyFuncs, I.Next<Iter>>,
  //         { parent: Node<Datum, KeyFuncs, Iter> }
  //       >
  //     >
  //   }
  //   > {
  //   return this?.height > 0
  // }

  hasParent(): this is this extends { depth: 0 } ? never : this {
    return this?.depth > 0
  }

  /**
   * @description Returns the array of leaf nodes for this node
   *
   * @see {@link https://github.com/d3/d3-hierarchy#leaves}
   */
  leaves() {
    const leaves = [] as unknown as Array<
      Node<
        Datum,
        KeyFuncs,
        I.IterationOf<KeyFuncs['length']>,
        KeyFuncs['length']
      >
    >

    this.eachBefore((node) => {
      if (!node.children)
        leaves.push(node)
    })
    return leaves
  }

  /**
   * Returns an array of links for this node and its descendants, where each *link* is an object that defines source and target properties. The source of each link is the parent node, and the target is a child node.
   * @see {@link https://github.com/d3/d3-hierarchy#links}
   * @see {@link path}
   */
  links(): NodeLinks<this> {
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
  path<ThisNode extends this, EndNode extends { depth: number }>(end: EndNode) {
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
          [...PathArray, Node<Datum, KeyFuncs, EndIter, I.Pos<EndIter>>]
        >
      }[N.LowerEq<I.Pos<EndIter>, EndNode['depth']>]
      1: ReturnPath<
        I.Prev<ThisIter>,
        EndIter,
        [...PathArray, Node<Datum, KeyFuncs, ThisIter, I.Pos<ThisIter>>]
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

  setColor(
    scale?: this['colorScale'],
    scaleBy?: this['colorScaleBy'],
    scaleMode?: this['colorScaleMode'],
    scaleNum?: this['colorScaleNum']
  ): void {
    this.each((node) => {
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
    return this
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
  setValues() {
    this.each(node => (node.value = node.valueFunction(node)))
    return this
  }

  toJSON(): ConditionalExcept<
    Omit<typeof this, 'parent'>,
    undefined | Function
    > {
    const node = filterObject(
      v => v !== undefined && typeof v !== 'function',
      this
    )

    delete node.parent
    // if (node.height === 0)
    //   delete node.children
    return node
  }
}
export class LeafNode<
  Datum,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>>
> extends Node<
  Datum,
  KeyFuncs,
  I.IterationOf<KeyFuncs['length']>,
  KeyFuncs['length']
> {
  constructor(keyFns: KeyFuncs, records: Datum[], id: ValueOf<Datum>) {
    super(
      keyFns,
      keyFns.length,
      records,
      id as unknown as this['id']
    )
    delete this.children
  }
}
export class RootNode<
  Datum,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>>
> extends Node<Datum, KeyFuncs, I.IterationOf<0>, 0> {
  constructor(keyFuncs: KeyFuncs, records: Datum[]) {
    super(
      keyFuncs,
      0,
      records,
      undefined as unknown as this['id']
    )
    delete this.parent
    delete this.id
    delete this.name
    delete this.dim
  }

}
export class HierarchyNode<
  Datum,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>>
> extends Node<
  Datum,
  KeyFuncs
> {
  constructor(
    keyFns: KeyFuncs,
    depth: number,
    records: Datum[],
    id: ValueOf<Datum>
  ) {
    super(
      keyFns,
      depth as this['depth'],
      records,
      id as unknown as this['id']
    )
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
