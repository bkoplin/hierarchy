import type {
  FixedLengthArray, JsonObject, JsonPrimitive,
} from 'type-fest'
import { zipObject, } from 'lodash-es'
import chroma from 'chroma-js'
import type { KeyFn, } from '../array/group.ts'
import { group, } from '../array/group.ts'

export function hierarchy<T extends JsonObject, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6>>(values: T[], childrenFns: KeyFns, dims?: string[]) {
  const data = [
    undefined,
    group<T, KeyFns>(
      values,
      ...childrenFns
    ),
  ]
  const root = new Node(
    data,
    childrenFns,
    dims
  )
  const nodes = [ root, ]
  let node = nodes.pop()

  while (node) {
    const children = Array.isArray(node.data) ? Array.from(node.data[1]) : null

    node.children = (children ?? []).map((child, i) => {
      const nodeChild = new Node(
        child,
        childrenFns,
        dims
      )

      nodeChild.parent = node
      nodeChild.depth = node.depth + 1
      nodes.push(nodeChild)
      return nodeChild
    })
    node = nodes.pop()
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

export function computeHeight(node: Node<any>) {
  let height = 0

  do node.height = height
  while ((node = node.parent) && (node.height < ++height))
}
export class Node<T> {
  data: FixedLengthArray<T | JsonObject, 2>
  depth: number
  height: number
  #parent: null | Node<T> = null
  #children?: Array<Node<T>> = []
  #keyFns: FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6>
  #dims: string[]
  constructor(data: [any, T | JsonObject], keyFns: FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6>, dims?: string[]) {
    this.data = data
    this.depth = 0
    this.height = 0
    this.#keyFns = keyFns
    this.#dims = dims ?? []
  }

  color(scale: keyof chroma.ChromaStatic['brewer']) {
    const depth = this.depth
    const ids = this?.ancestors()?.reverse()?.[0] as string[]
    const colors = chroma.scale(scale).colors(ids.length)
    const colorObject = zipObject(
      ids,
      colors
    )

    console.log(ids.descendants())

    return colorObject[this.id as string]
  }

  get id() {
    return this.data[0]
  }

  get parent() {
    return this.#parent
  }

  set parent(val) {
    this.#parent = val
  }

  get idPath() {
    return this.ancestors().map(ancestor => ancestor.id)
      .filter(v => v !== undefined) as unknown as JsonPrimitive[]
  }

  get dimPath() {
    return this.ancestors().map(ancestor => ancestor.dim)
      .filter(v => v !== undefined) as unknown as JsonPrimitive[]
  }

  get records() {
    return this.leaves().map(leaf => leaf.data)
  }

  get children() {
    return this.#children
  }

  set children(children) {
    if (children?.length)
      this.#children = children
  }

  get dim(): string | undefined {
    return this.#dims?.[this.depth - 1]
  }

  get keyFn() {
    return this.#keyFns[this.depth - 1]
  }

  eachBefore(callback: { (node: Node<T>): void; (node: any): void; call?: any }, that?: Node<T>): this {
    const nodes = [ this, ]
    let node = nodes.pop()
    let children = node?.children
    let index = -1

    while (node) {
      callback.call(
        that,
        node,
        ++index,
        this
      )
      children?.forEach((child) => { nodes.push(child) })
      node = nodes.pop()
      children = node?.children
    }
    return this
  }

  eachAfter(callback: { (node: Node<T>): void; (node: any): void; call?: any }, that?: Node<T>): this {
    const nodes = [ this, ]
    let node = nodes.pop()
    let children = node?.children
    const next: Array<Node<T>> = []
    let index = -1

    while (node) {
      next.push(node)
      children?.forEach((child) => { nodes.push(child) })
      callback.call(
        that,
        node,
        ++index,
        this
      )
      node = next.pop()
      children = node?.children
    }
    return this
  }

  leaves() {
    const leaves: Array<Node<T>> = []

    this.eachBefore((node) => {
      if (!node.height)
        leaves.push(node)
    })
    return leaves
  }

  descendants() {
    const nodes = [ this, ]

    this.eachAfter((node) => { nodes.push(node) })

    return nodes
  }

  ancestors() {
    const nodes = [ this, ]
    let node = this.parent

    while (node) {
      nodes.push(node)
      node = node.parent
    }

    return nodes
  }

  find(callback: { (data: JsonObject): void; (node: any): void; call?: any }, that?: Node<T>) {
    let index = -1

    for (const node of this.leaves()) {
      if (callback.call(
        that,
        node,
        ++index,
        this
      ))
        return node
    }
  }
}

// Node.prototype = hierarchy.prototype = {
//   constructor: Node,
//   count: node_count,
//   each: node_each,
//   eachAfter: node_eachAfter,
//   eachBefore: node_eachBefore,
//   find: node_find,
//   sum: node_sum,
//   sort: node_sort,
//   path: node_path,
//   ancestors: node_ancestors,
//   descendants: node_descendants,
//   leaves: node_leaves,
//   links: node_links,
//   copy: node_copy,
//   [Symbol.iterator]: node_iterator,
// }
