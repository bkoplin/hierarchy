import type {
  FixedLengthArray, Get, JsonPrimitive, StringKeyOf, ValueOf,
} from 'type-fest'
import {
  difference,
  isEqual,
  isObjectLike,
  uniq, zipObject,
} from 'lodash-es'
import chroma from 'chroma-js'
import type { L, } from 'ts-toolbelt'
import {
  contains,
  intersection, prop,
} from 'rambdax'
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

export function hierarchy<T, KeyFns extends FixedLengthArray<[StringKeyOf<T>, KeyFn<T>] | StringKeyOf<T>, 1>>(values: T[], ...childrenFns: KeyFns): Node<[undefined, NestedMap<T, 1>], T>
export function hierarchy<T, KeyFns extends FixedLengthArray<[StringKeyOf<T>, KeyFn<T>] | StringKeyOf<T>, 2>>(values: T[], ...childrenFns: KeyFns): Node<[undefined, NestedMap<T, 2>], T>
export function hierarchy<T, KeyFns extends FixedLengthArray<[StringKeyOf<T>, KeyFn<T>] | StringKeyOf<T>, 3>>(values: T[], ...childrenFns: KeyFns): Node<[undefined, NestedMap<T, 3>], T>
export function hierarchy<T, KeyFns extends FixedLengthArray<[StringKeyOf<T>, KeyFn<T>] | StringKeyOf<T>, 4>>(values: T[], ...childrenFns: KeyFns): Node<[undefined, NestedMap<T, 4>], T>
export function hierarchy<T, KeyFns extends FixedLengthArray<[StringKeyOf<T>, KeyFn<T>] | StringKeyOf<T>, 1 | 2 | 3 | 4>>(values: T[], ...childrenFns: KeyFns) {
  const funcs = childrenFns.map((c) => {
    if (Array.isArray(c)) {
      return c[1]
    }
    else {
      return (d: T): Get<T, typeof c> => prop(
        c,
        d
      )
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
    group(
      values,
      ...funcs
    ),
  ] as const
  const children = <Data>(d: [unknown, Data]) => {
    return Array.isArray(d) ? d[1] : null
  }
  const root = new Node(
    data,
    funcs,
    dims
  )
  const nodes = [ root, ]
  let node: Node<[undefined, NestedMap<T, L.Length<KeyFns>>], T>

  node = nodes.pop() as Node<[undefined, NestedMap<T, L.Length<KeyFns>>], T>
  while (typeof node !== 'undefined') {
    const childs = children(node.data)

    if (childs) {
      const childArray = Array.from(childs)

      childArray.reverse().forEach((child, i) => {
        const nodeChild = new Node(
          childArray[i],
          funcs,
          dims
        )

        nodeChild.parent = node
        nodeChild.depth = node.depth + 1
        nodes.push(nodeChild)
        if (typeof node.children === 'undefined')
          node.children = []
        node.children.push(nodeChild)
      })
    }
    node = nodes.pop()
  }

  return root.each((node) => {
    const thisNodeDim = node.dims?.[node.depth - 1]

    if (typeof thisNodeDim !== 'undefined') {
      node.dim = thisNodeDim
      node.id = node.data[0]
    }
  })
    .eachBefore((node) => {
      let height = 0

      do node.height = height
      while ((node = node.parent) && (node.height < ++height))
    })
    .each((node) => {
      node.records = node.leaves().map(leaf => leaf.data as T)
      node.setIds()
    })
}

function computeHeight(node: Node<any>) {
  let height = 0

  do node.height = height
  while ((node = node.parent) && (node.height < ++height))
}
export class Node<T, RecType> {
  [Symbol.iterator] = node_iterator
  id: JsonPrimitive | undefined
  idPath: Array<ValueOf<RecType>> = []
  dimPath: Array<keyof RecType> = []
  dim: StringKeyOf<RecType> | undefined
  data: T
  depth: number
  height: number
  #parent: null | Node<T, RecType> = null
  children?: Array<Node<T, RecType>>
  #keyFns: Array<KeyFn<RecType>>
  dims: Array<keyof RecType>
  #records: RecType[] = []
  constructor(data: T, keyFns: Array<KeyFn<RecType>>, dims: Array<keyof RecType>) {
    this.data = data
    this.depth = 0
    this.height = 0
    this.#keyFns = keyFns
    this.dims = dims
  }

  count = node_count
  each(callback: (node: this, index: number) => this, that?: this): this {
    return node_each.bind(this)(
      callback,
      that
    )
  }

  eachBefore(callback: (node: this, index: number) => this, that?: this): this {
    return node_eachBefore.bind(this)(
      callback,
      that
    )
  }

  eachAfter(callback: (node: this, index: number) => this, that?: this): this {
    return node_eachAfter.bind(this)(
      callback,
      that
    )
  }

  lookup(id: ValueOf<RecType> | Array<ValueOf<RecType>> | Partial<RecType>, exact = true) {
    const desc = this.descendants()

    if (Array.isArray(id)) {
      if (exact) {
        return desc.find(node => id.length === node.idPath.length && difference(
          node.idPath,
          id
        ).length === 0)
      }

      else {
        return desc.find(node => difference(
          id,
          node.idPath
        ).length === 0)
      }
    }
    else if (isObjectLike(id)) {
      if (exact) {
        return desc.find(node => isEqual(
          zipObject(
            node.dimPath,
            node.idPath
          ),
          id
        ))
      }

      else {
        return desc.find(node => contains(
          id,
          zipObject(
            node.dimPath,
            node.idPath
          )
        ))
      }
    }
    return desc.find(node => node.id === id)
  }

  lookupMany(id: Exclude<this['id'], undefined> | Array<Exclude<this['id'], undefined>> | Record<string | number | symbol, Exclude<this['id'], undefined>>, exact = true) {
    const desc = this.descendants()

    if (Array.isArray(id)) {
      if (exact) {
        return desc.filter(node => difference(
          node.idPath,
          id
        ).length === 0 && difference(
          id,
          node.idPath
        ).length === 0)
      }
      else {
        return desc.filter(node => intersection(
          node.idPath,
          id
        ).length > 0)
      }
    }
    else if (isObjectLike(id)) {
      if (exact) {
        return desc.filter(node => isEqual(
          zipObject(
            node.dimPath,
            node.idPath
          ),
          id
        ))
      }

      else {
        return desc.filter(node => contains(
          id,
          zipObject(
            node.dimPath,
            node.idPath
          )
        ))
      }
    }
    return desc.filter(node => node.id === id)
  }

  find(callback: (node: this) => boolean, that?: this): this {
    return node_find.bind(this)(
      callback,
      that
    )
  }

  sum(...args: Parameters<typeof node_sum>) { return node_sum.bind(this)(...args) }
  sort(...args: Parameters<typeof node_sort>) { return node_sort.bind(this)(...args) }
  path(end: this): this[] { return node_path.bind(this)(end) }
  ancestors(...args: Parameters<typeof node_ancestors>) { return node_ancestors.bind(this)(...args) as this[] }
  descendants(...args: Parameters<typeof node_descendants>) { return node_descendants.bind(this)(...args) as this[] }
  descendantsAt(depthOrDim: number | keyof RecType, ...args: Parameters<typeof node_descendants>) {
    return node_descendants.bind(this)(...args).filter((node) => {
      if (typeof depthOrDim === 'number')
        return node.depth === depthOrDim

      else
        return node.dim === depthOrDim
    }) as this[]
  }

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

  setIds() {
    this.idPath = this.ancestors().map(ancestor => ancestor.id)
      .filter(v => v !== undefined) as unknown as JsonPrimitive[]
    this.dimPath = this.ancestors().map(ancestor => ancestor.dim)
      .filter(v => v !== undefined) as unknown as Array<keyof RecType>
  }

  get records() {
    return this.#records
  }

  set records(records: RecType[]) {
    this.#records = records
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
