import node_count from './count.js'
import node_each from './each.js'
import node_eachBefore from './eachBefore.js'
import node_eachAfter from './eachAfter.js'
import node_find from './find.js'
import node_sum from './sum.js'
import node_sort from './sort.js'
import node_path from './path.js'
import node_ancestors from './ancestors.js'
import node_descendants from './descendants.js'
import node_leaves from './leaves.js'
import node_links from './links.js'
import node_iterator from './iterator.js'
import {F} from 'ts-toolbelt'
import {group} from '../array/group.ts'

export default function hierarchy(data, childrenFn) {
  if (data instanceof Map) {
    data = [
      undefined,
      data,
    ]
    if (childrenFn === undefined)
      childrenFn = mapChildren
  }
  else if (childrenFn === undefined) {
    childrenFn = objectChildren
  }

  const root = new Node(data)
  let node
  const nodes = [ root, ]
  let child
  let childs
  let i
  let n

  while (node = nodes.pop()) {
    if ((childs = childrenFn(node.data)) && (n = (childs = Array.from(childs)).length)) {
      node.children = childs
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = childs[i] = new Node(childs[i]))
        child.parent = node
        child.depth = node.depth + 1
      }
    }
  }

  return root.eachBefore(computeHeight)
}

function node_copy() {
  return hierarchy(this).eachBefore(copyData)
}

function objectChildren(d) {
  return d.children
}

function mapChildren<T>(d: T[]) {
  return Array.isArray(d) ? d[1] : null
}

function copyData(node) {
  if (node.data.value !== undefined)
    node.value = node.data.value
  node.data = node.data.data
}

export function computeHeight(node) {
  let height = 0

  do node.height = height
  while ((node = node.parent) && (node.height < ++height))
}
export class Node {
  constructor(data) {
    this.data = data
    this.depth = 0
    this.height = 0
    this.parent = null
  }

  each<T extends F.Function<[Node, number, Node[]], Node[]>>(this: Node[], callback: T, that = Node) {
    let index = -1

    for (const node of this) {
      callback.call(
        that,
        node,
        ++index,
        this
      )
    }

    return this
  }
}

Node.prototype = hierarchy.prototype = {
  constructor: Node,
  count: node_count,
  each: node_each,
  eachAfter: node_eachAfter,
  eachBefore: node_eachBefore,
  find: node_find,
  sum: node_sum,
  sort: node_sort,
  path: node_path,
  ancestors: node_ancestors,
  descendants: node_descendants,
  leaves: node_leaves,
  links: node_links,
  copy: node_copy,
  [Symbol.iterator]: node_iterator,
}
