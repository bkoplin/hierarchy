import { filterObject, } from 'rambdax'
import type { N, } from 'ts-toolbelt'
import type {
  IterableElement, LiteralUnion, Simplify,
  StringKeyOf,
  ValueOf,
} from 'type-fest'
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
  }

  [Symbol.iterator] = iterator
  children = [] as unknown as Height extends 0 ? undefined : Array<Node<T, N.Add<Depth, 1>, N.Sub<Height, 1>>>
  parent = undefined as undefined | Node<T, N.Sub<Depth, 1>, N.Add<Height, 1>>

  addChild(child: Height extends 0 ? never : Node<T, N.Add<Depth, 1>, N.Sub<Height, 1>>) {
    this.children?.push(child)
  }

  addParent(parent: Exclude<this['parent'], undefined>) {
    this.parent = parent
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
    delete this.dim
  }
}
export class HierarchyNode<
  T,
  Depth extends Exclude<DepthAndHeight, 0 | 8>,
  Height extends Exclude<DepthAndHeight, 0 | 8>
> extends Node<T, Depth, Height> {
  constructor(
    depth: Depth,
    height: Height,
    records: T[],
    id: ValueOf<T>,
    dim: StringKeyOf<T>
  ) {
    super(
      depth,
      height,
      records,
      id,
      dim
    )
  }
}
