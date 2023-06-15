import type { Node, } from './index'

/**
 * @description Invokes the specified function for node and each descendant in breadth-first order, such that a given node is only visited if all nodes of lesser depth have already been visited, as well as all preceding nodes of the same depth. The specified function is passed the current descendant, the zero-based traversal index, and this node. If that is specified, it is the this contex
 * t of the callback.
 * _See_ https://github.com/d3/d3-hierarchy#node_each
 *
 */
export default function<NodeIn extends Node>(
  this: NodeIn,
  callback: (
    node: NodeIn,
    traversalIndex: number,
    context: NodeIn,
  ) => void,
  that = this
) {
  let index = -1

  for (const node of this) {
    callback(
      node,
      ++index,
      this
    )
  }

  return this
}
