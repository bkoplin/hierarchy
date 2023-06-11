import type {
  FixedLengthArray, JsonObject, JsonPrimitive, StringKeyOf,
} from 'type-fest'
import {
  uniq, zipObject,
} from 'lodash-es'
import chroma from 'chroma-js'
import type { L, } from 'ts-toolbelt'
import { prop, } from 'rambdax'
import type {
  KeyFn, NestedMap,
} from '../array/types'
import { group, } from '../array/group'
import node_each from './each.js'
import node_eachAfter from './eachAfter.js'
import node_eachBefore from './eachBefore.js'
import node_count from './count.js'
import node_ancestors from './ancestors.js'
import node_descendants from './descendants.js'
import node_find from './find.js'
import node_leaves from './leaves.js'
import node_sum from './sum.js'
import node_sort from './sort.js'
import node_path from './path.js'
import node_links from './links.js'
import node_iterator from './iterator'

// export function hierarchy<T>(): Node<>
export function hierarchy<T, KeyFns extends FixedLengthArray<[keyof T, KeyFn<T>] | string, 1 | 2 | 3 | 4 | 5 | 6>>(values: T[], ...childrenFns: KeyFns) {
  const [ firstChildFn, ] = childrenFns
  const funcs = childrenFns.map((c) => {
    if (typeof c === 'string') {
      return d => prop(
        c,
        d
      )
    }
    else {
      return c[1]
    }
  })
  const dims = childrenFns.map((c) => {
    if (typeof c === 'string')
      return c

    else
      return c[0]
  })
  const data = [
    undefined,
    group<T, FixedLengthArray<KeyFn<T>, L.Length<KeyFns>>>(
      values,
      ...funcs
    ),
  ] as const
  const children = (d) => {
    return Array.isArray(d) ? d[1] : null
  }
  const root = new Node(
    data,
    funcs,
    dims
  )
  let node
  const nodes = [ root, ]
  let child
  let childs
  let i
  let n

  while (node = nodes.pop()) {
    if ((childs = children(node.data)) && (n = (childs = Array.from(childs)).length)) {
      node.children = childs
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = childs[i] = new Node(
          childs[i],
          funcs,
          dims
        ))
        child.parent = node
        child.depth = node.depth + 1
      }
    }
  }

  return root.eachAfter((node) => {
    if (typeof node.children === 'undefined')
      delete node.children
  }).eachBefore((node) => {
    let height = 0

    do node.height = height
    while ((node = node.parent) && (node.height < ++height))
  })
    .each((node) => {
      if (typeof node.data === 'undefined')
        return
      node.dim = node.dims?.[node.depth - 1]
      node.id = Array.isArray(node.data) ? node.data[0] : node.data[node.dim]
    }) as unknown as Node<[undefined, NestedMap<T, number & L.Length<KeyFns>>], KeyFns, T>
}

function computeHeight(node: Node<any>) {
  let height = 0

  do node.height = height
  while ((node = node.parent) && (node.height < ++height))
}
export class Node<T, KeyFns extends FixedLengthArray<any, 1 | 2 | 3 | 4 | 5 | 6>, RecType = JsonObject> {
  [Symbol.iterator] = node_iterator
  id: JsonPrimitive | undefined
  dim: StringKeyOf<RecType> | undefined
  data: T
  depth: number
  height: number
  #parent: null | Node<T, KeyFns> = null
  children?: Array<Node<T, KeyFns>>
  #keyFns: KeyFns
  dims: FixedLengthArray<StringKeyOf<RecType>, L.Length<KeyFns>>
  constructor(data: T, keyFns: KeyFns, dims: FixedLengthArray<StringKeyOf<RecType>, L.Length<KeyFns>>) {
    this.data = data
    this.depth = 0
    this.height = 0
    this.#parent = null
    this.#keyFns = keyFns
    this.dims = dims
    this.dim = undefined
    this.id = undefined
  }

  count = node_count
  each(callback: (node: this) => this, that?: this): this {
    return node_each.bind(this)(
      callback,
      that
    )
  }

  eachBefore(callback: (node: this) => this, that?: this): this {
    return node_eachBefore.bind(this)(
      callback,
      that
    )
  }

  eachAfter(callback: (node: this) => this, that?: this): this {
    return node_eachAfter.bind(this)(
      callback,
      that
    )
  }

  find(callback: (node: this) => this, that?: this): this {
    return node_find.bind(this)(
      callback,
      that
    )
  }

  sum(...args: Parameters<typeof node_sum>) { return node_sum.bind(this)(...args) }
  sort(...args: Parameters<typeof node_sort>) { return node_sort.bind(this)(...args) }
  path(end: this): this[] { return node_path.bind(this)(end) }
  ancestors(...args: Parameters<typeof node_ancestors>) { return node_ancestors.bind(this)(...args) as this[] }
  descendants(...args: Parameters<typeof node_descendants>) { return node_descendants.bind(this)(...args) }
  leaves() { return node_leaves.bind(this)() as this[] }
  links(...args: Parameters<typeof node_links>) { return node_links.bind(this)(...args) }
  color(scale: keyof chroma.ChromaStatic['brewer'] = 'Spectral') {
    const root = this.ancestors().reverse()[0]
    const ids = uniq(root.descendants().filter(d => d.dim === this.dim)
      .map(d => d.id)) as string[]
    const colors = chroma.scale(scale).colors(ids.length)
    const colorObject = zipObject(
      ids,
      colors
    )

    return colorObject[this.id as string]
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
    return this.leaves().map(leaf => leaf.data) as RecType[]
  }

  get keyFn() {
    return this.#keyFns[this.depth - 1]
  }

  get parent() {
    return this.#parent
  }

  set parent(parent: Node<T, KeyFns> | null) {
    this.#parent = parent
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
