import {
  filterObject, length, pipe, prop,
} from 'rambdax'
import type { N, } from 'ts-toolbelt'
import type {
  IterableElement, LiteralUnion, RequireExactlyOne, Simplify,
  StringKeyOf,
  ValueOf,
} from 'type-fest'
import type {
  ChromaStatic, Color,
} from 'chroma-js'
import { iterator, } from './iterator'
import type { DepthAndHeight, } from './index.d'

export abstract class Node<T, Depth extends number, Height extends number> {
  constructor(
    public depth: Depth,
    public height: Height,
    public records: T[],
    public id: Depth extends 0 ? undefined : ValueOf<T>,
    public dim: Depth extends 0 ? undefined : StringKeyOf<T>
  ) {
    this.name = id
    this.value = this.valueFunction(this)
  }

  [Symbol.iterator] = iterator<T>
  children = [] as unknown as Height extends 0 ? undefined : Array<Node<T, N.Add<Depth, 1>, N.Sub<Height, 1>>>
  color?: string
  colorScale?: StringKeyOf<ChromaStatic['brewer']> | Array<string | Color>
  colorScaleBy?: 'parentListOnly' | 'allNodesAtDim'
  colorScaleMode?: 'e' | 'q' | 'l' | 'k'
  colorScaleNum?: number
  name: this['id'] = undefined as unknown as this['id']
  parent = undefined as undefined | Node<T, N.Sub<Depth, 1>, N.Add<Height, 1>>
  value = 0
  /**
   * The function to set the value of the node
   * @default pipe(prop('records'), length)
   */
  valueFunction: (args_0: Node<T, number, number>) => number = pipe<[Node<T, number, number>], T[], number>(
    prop('records'),
    length
  )

  addChild(child: Height extends 0 ? never : Node<T, N.Add<Depth, 1>, N.Sub<Height, 1>>) {
    this.children?.push(child)
  }

  /**
   *
   * Finds the first ancestor node that matches the specified parameter. The parameter can be either the depth or dimension to find.
   *
   * @param depthOrDim A parameter indicating either the depth or the dimension of the ancestor to return.
   */

  ancestorAt(depthOrDim: RequireExactlyOne<
    { depth?: number; dim?: StringKeyOf<T> },
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

    return nodes
  }

  /**
   * Invokes the specified function for node and each descendant in breadth-first order,
   * such that a given node is only visited if all nodes of lesser depth have already been
   * visited, as well as all preceding nodes of the same depth. The specified function is
   * passed the current descendant, the zero-based traversal index, and this node. If that
   * is specified, it is the this context of the callback.
   */
  each(callback: (node: Node<T, number, number>, index?: number) => void): this {
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
  eachAfter(callback: (node: Node<T, number, number>, index?: number) => void): this {
    const nodes = [ this, ] as unknown as Array<typeof node>
    const next = [] as unknown as Array<typeof node>
    let children
    let i: number, n: number
    let index = -1
    let node: IterableElement<Node<T, Depth, Height>> | undefined

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
  eachBefore(callback: (node: Node<T, number, number>, index?: number) => void): this {
    const nodes = [ this, ] as unknown as Array<typeof node>
    let children
    let i
    let index = -1
    let node: IterableElement<Node<T, Depth, Height>> | undefined

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

  hasChildren<Child extends Node<T, N.Add<Depth, 1>, N.Sub<Height, 1>>>(this: this | unknown): this is Simplify<Node<T, Depth, Exclude<Height, 0>> & { children: Child[] } > {
    return (this as Simplify<Node<T, Depth, Exclude<Height, 0>> & { children: Child[] } >)?.height > 0 && typeof (this as Simplify<Node<T, Depth, Exclude<Height, 0>> & { children: Child[] } >)?.children !== 'undefined'
  }

  hasParent<Parent extends Node<T, N.Sub<Depth, 1>, N.Add<Height, 1>>>(this: this | unknown): this is Simplify<Node<T, Exclude<Depth, 0>, Height> & { parent: Parent } > {
    return (this as Simplify<Node<T, Exclude<Depth, 0>, Height> & { parent: Parent } >)?.depth > 0 && typeof (this as Simplify<Node<T, Exclude<Depth, 0>, Height> & { parent: Parent } >)?.parent !== 'undefined'
  }

  /**
   * @description Returns the array of leaf nodes for this node
   *
   * @see {@link https://github.com/d3/d3-hierarchy#leaves}
   */
  leaves() {
    const leaves: Array<Node<T, Height, 0>> = []

    this.eachBefore((node) => {
      if (!node.children)
        leaves.push(node)
    })
    return leaves
  }

  /**
   * @description Returns an array of links for this node and its descendants, where each link is an object that defines source and target properties. The source of each link is the parent node, and the target is a child node.
   * @see {@link https://github.com/d3/d3-hierarchy#links}
   */
  links() {
    const links: Array<{
      source: Node<T, number, number>['parent']
      target: Node<T, number, number>
    }> = []

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
  path(end: this) {
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

  setValues() {
    this.value = this.valueFunction(this)
  }

  toJSON(this: Simplify<Node<T, Depth, Height> & { parent?: Node<T, Depth, Height>; children?: Array<Node<T, Depth, Height>> } >) {
    const node = filterObject(
      v => v !== undefined,
      this
    )

    delete node.parent
    // if (node.height === 0)
    //   delete node.children
    return node
  }
}
export class LeafNode<T, Depth extends LiteralUnion<Exclude<DepthAndHeight, 0>, number>> extends Node<T, Depth, 0> {
  constructor(depth: Depth, records: T[], id: Depth extends 0 ? undefined : ValueOf<T>, dim: Depth extends 0 ? undefined : StringKeyOf<T>) {
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
export class RootNode<T, Height extends LiteralUnion<Exclude<DepthAndHeight, 0>, number>> extends Node<T, 0, Height> {
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
  Depth extends Exclude<DepthAndHeight, 0 | 8>,
  Height extends Exclude<DepthAndHeight, 0 | 8>
> extends Node<T, Depth, Height> {
  constructor(...args: ConstructorParameters<typeof Node<T, Depth, Height>>) {
    super(...args)
  }
}

function leastCommonAncestor(a: Node<JsonObject, number, number>, b: Node<JsonObject, number, number>) {
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
