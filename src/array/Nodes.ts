import {
  filterObject, length, pipe, prop,
} from 'rambdax'
import type {
  IterableElement,
  RequireExactlyOne,
  Simplify,
  StringKeyOf,
  ValueOf,
} from 'type-fest'
import type {
  ChromaStatic, Color,
} from 'chroma-js'
import type { N, } from 'ts-toolbelt'
import { iterator, } from './iterator'
import type {
  KeyFnsLength, NodeType, NumericUnion,
} from './types'

export abstract class Node<
  T,
  RootHeight extends Exclude<KeyFnsLength, 0>,
  Depth extends number
> {
  constructor(
    public depth: Depth,
    public height: N.Sub<RootHeight, Depth>,
    public records: T[],
    public id: Depth extends 0 ? undefined : ValueOf<T>,
    public dim: Depth extends 0 ? undefined : StringKeyOf<T>
  ) {
    this.name = id
    this.value = this.valueFunction(this)
  }

  [Symbol.iterator] = iterator<T, Depth, RootHeight>

  children = [] as unknown as N.Lower<this['depth'], RootHeight> extends 0
    ? undefined
    : Array<NodeType<T, N.Add<this['depth'], 1>, RootHeight>>

  color?: string
  colorScale?: StringKeyOf<ChromaStatic['brewer']> | Array<string | Color>
  colorScaleBy?: 'parentListOnly' | 'allNodesAtDim'
  colorScaleMode?: 'e' | 'q' | 'l' | 'k'
  colorScaleNum?: number
  name: this['id']
  parent = undefined as unknown as N.GreaterEq<Depth, 1> extends 0
    ? undefined
    : NodeType<T, N.Sub<Depth, 1>, RootHeight>

  value = 0

  /**
   * The function to set the value of the node
   * @default pipe(prop('records'), length)
   */
  valueFunction: (args_0: this) => number = pipe<[typeof this], T[], number>(
    prop('records'),
    length
  )

  addChild(child: IterableElement<NodeType<T, Depth, RootHeight>['children']>) {
    if (this.height > 0)
      this.children?.push(child)
  }

  /**
   *
   * Finds the first ancestor node that matches the specified parameter. The parameter can be either the depth or dimension to find.
   *
   * @param depthOrDim A parameter indicating either the depth or the dimension of the ancestor to return.
   */

  ancestorAt(depthOrDim: RequireExactlyOne<
      { depth?: NumericUnion<0, Depth>; dim?: StringKeyOf<T> },
      'depth' | 'dim'
    >) {
    return this.ancestors().find((node) => {
      if (typeof depthOrDim.depth === 'number')
        return node.depth === depthOrDim.depth
      else return node.dim === depthOrDim.dim
    })
  }

  /**
   * @description Returns the array of ancestors nodes, starting with this node, then followed by each parent up to the root.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#ancestors}
   * @memberof Node
   */
  ancestors() {
    const nodes = [ this, ]
    let node = this

    while (typeof node !== 'undefined' && typeof node.parent !== 'undefined') {
      nodes.push(node.parent as unknown as this)
      node = node.parent as unknown as this
    }

    return nodes as unknown as Array<
      NodeType<T, NumericUnion<0, Depth>, RootHeight>
      >
  }

  each(callback) {
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
  eachAfter(callback: (node: NodeType<T, NumericUnion<Depth, RootHeight>, RootHeight>, index?: number) => void): this {
    const nodes = [ this, ]
    const next = []
    let children
    let i: number, n: number
    let index = -1
    let node: NodeType<T, NumericUnion<Depth, RootHeight>, RootHeight> | undefined

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
   */
  eachBefore(callback: (node: NodeType<T, NumericUnion<Depth, RootHeight>, RootHeight>, index?: number) => void): this {
    const nodes = [ this, ]
    let children
    let i
    let index = -1
    let node: NodeType<T, NumericUnion<Depth, RootHeight>, RootHeight> | undefined

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

  hasChildren() {
    return this?.height > 0 && typeof this?.children !== 'undefined'
  }

  hasParent() {
    return this?.depth > 0 && typeof this?.parent !== 'undefined'
  }

  /**
   * @description Returns the array of leaf nodes for this node
   *
   * @see {@link https://github.com/d3/d3-hierarchy#leaves}
   */
  leaves(): Array<NodeType<T, RootHeight, RootHeight>> {
    const leaves: Array<NodeType<T, RootHeight, RootHeight>> = []

    this.eachBefore((node) => {
      if (!node.children)
        leaves.push(node)
    })
    return leaves
  }

  links: NodeType<T, Depth, RootHeight>['links'] = function (this: NodeType<T, Depth, RootHeight>) {
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
   * @param {this} end the target node
   */
  path(end: NodeType<T, number, RootHeight>) {
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

  setValueFunction(valueFn: this['valueFunction']) {
    this.each(node => (node.valueFunction = valueFn))
  }

  setValues() {
    this.each(node => (node.value = node.valueFunction(node)))
  }

  toJSON(this: Simplify<
      Node<T, RootHeight, number> & {
        parent?: Node<T, RootHeight, number>
        children?: Array<Node<T, RootHeight, number>>
      }
    >) {
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
export class LeafNode<T, Depth extends Exclude<KeyFnsLength, 0>> extends Node<
  T,
  Depth,
  Depth
> {
  constructor(depth: Depth, records: T[], id: ValueOf<T>, dim: StringKeyOf<T>) {
    super(
      depth,
      0,
      records,
      id,
      dim
    )

    delete this.children
  }
}
export class RootNode<T, Height extends Exclude<KeyFnsLength, 0>> extends Node<
  T,
  0,
  Height
> {
  constructor(height: Height, records: T[]) {
    super(
      0,
      height,
      records,
      undefined,
      undefined
    )
    delete this.parent
    delete this.id
    delete this.name
    delete this.dim
  }
}
export class HierarchyNode<
  T,
  Depth extends Exclude<KeyFnsLength, 0>,
  RootHeight extends Exclude<KeyFnsLength, 0>
> extends Node<T, Depth, RootHeight> {
  constructor(...args: ConstructorParameters<
      typeof Node<T, Depth, RootHeight>
    >) {
    super(...args)
  }
}

function leastCommonAncestor<
  A extends Node<any, KeyFnsLength, Exclude<KeyFnsLength, 0>>,
  B extends Node<any, KeyFnsLength, Exclude<KeyFnsLength, 0>> | A
>(a: A, b: B): A | null {
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
