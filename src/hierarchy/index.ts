import safeStableStringify from 'safe-stable-stringify'
import type {
  FixedLengthArray, Get, JsonPrimitive, SetNonNullable, SetRequired, StringKeyOf, ValueOf,
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
  contains, length, prop,
} from 'rambdax'
import { pie, } from 'd3-shape'
import { scaleDiverging, } from 'd3-scale'
import paper from 'paper'
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

export const angleConverter = {
  fromPaper: scaleDiverging()
    .domain([
      -180,
      0,
      180,
    ])
    .range([
      -0.5 * Math.PI,
      Math.PI * 0.5,
      1.5 * Math.PI,
    ]),
  toPaper: (radiansRaw: number) => {
    const pt = new paper.Point({
      angle: (radiansRaw / Math.PI * 180) + 270,
      length: 1,
    })

    return pt.angle
  },
}
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

  return root
    .eachBefore((node) => {
      let height = 0

      do node.height = height
      while ((node = node.parent) && (node.height < ++height))
    })
    .setIds()
    .setRecords()
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
  #valueFn?: (values: RecType[]) => number
  dims: Array<keyof RecType>
  _pie: {
    radians: {
      start: number
      end: number
      padding: number
      midPoint: number
    }
    degrees: {
      start: number
      end: number
      padding: number
      midPoint: number
    }
  } = {
      radians: {
        start: 0,
        end: 0,
        padding: 0,
        midPoint: 0,
      },
      degrees: {
        start: 0,
        end: 0,
        padding: 0,
        midPoint: 0,
      },
    }

  value = 0
  _records: RecType[] = []
  constructor(data: T, keyFns: Array<KeyFn<RecType>>, dims: Array<keyof RecType>) {
    this.data = data
    this.depth = 0
    this.height = 0
    this.#keyFns = keyFns
    this.dims = dims
  }

  get pie() {
    return this._pie
  }

  set pie(pieDatum) {
    this._pie = {
      ...this._pie,
      ...pieDatum,
    }
  }

  get valueFn() {
    return this.#valueFn ?? length
  }

  set valueFn(fn: (values: RecType[]) => number) {
    this.#valueFn = fn
  }

  setValues(callback?: (values: RecType[]) => number) {
    return this.each((node) => {
      if (callback)
        node.valueFn = callback
      node.value = node.valueFn(node.records)
    })
  }

  copy() {
    if (this.records.length === 0)
      this.setRecords()
    const theseDims = this.dims.slice(this.depth)
    const theseKeyFns = this.#keyFns.slice(this.depth)
    const theseRecords = this.records

    return hierarchy(
      theseRecords,
      ...theseDims.map((d, i) => [
        d,
        theseKeyFns[i],
      ])
    ).setValues(this.valueFn)
  }

  exportJSON() {
    return JSON.parse(safeStableStringify(this.copy().eachAfter((node) => {
      delete node.data
    })))
  }

  count = node_count
  each(callback: (node: this, index?: number) => this, that?: this): this {
    return node_each.bind(this)(
      callback,
      that
    )
  }

  eachBefore(callback: (node: this, index?: number) => this, that?: this): this {
    return node_eachBefore.bind(this)(
      callback,
      that
    )
  }

  eachAfter(callback: (node: this, index?: number) => this, that?: this): this {
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

  lookupMany(ids: Array<ValueOf<RecType>> | Array<Array<ValueOf<RecType>>> | Array<Partial<RecType>>, exact = true) {
    const desc = this.descendants()
    const [ firstId, ] = ids

    if (Array.isArray(firstId)) {
      if (exact) {
        return desc.find(node => (ids as Array<Array<ValueOf<RecType>>>).some(id => id.length === node.idPath.length && difference(
          node.idPath,
          id
        ).length === 0))
      }

      else {
        return desc.find(node => (ids as Array<Array<ValueOf<RecType>>>).some(id => difference(
          id,
          node.idPath
        ).length === 0))
      }
    }
    else if (isObjectLike(firstId)) {
      if (exact) {
        return desc.find(node => (ids as Array<Partial<RecType>>).some(id => isEqual(
          zipObject(
            node.dimPath,
            node.idPath
          ),
          id
        )))
      }

      else {
        return desc.find(node => (ids as Array<Partial<RecType>>).some(id => contains(
          id,
          zipObject(
            node.dimPath,
            node.idPath
          )
        )))
      }
    }
    return desc.find(node => (ids as Array<ValueOf<RecType>>).includes(node.id as ValueOf<RecType>))
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

  ancestorAt(filter: string | number) {
    if (typeof filter === 'number')
      return this.ancestors().find(d => d.depth === filter)
    else if (typeof filter === 'string')
      return this.ancestors().find(d => d.dim === filter)
  }

  setRecords() {
    return this.each(node => node.records = node.leaves().flatMap((leaf): RecType => leaf.data))
  }

  setIds() {
    return this.each((node) => {
      const thisNodeDim = node.dims?.[node.depth - 1]

      if (typeof thisNodeDim !== 'undefined') {
        node.dim = thisNodeDim
        node.id = node.data[0]
      }
      node.idPath = node.ancestors().map(ancestor => ancestor.id)
        .filter(v => v !== undefined) as unknown as JsonPrimitive[]
      node.dimPath = node.ancestors().map(ancestor => ancestor.dim)
        .filter(v => v !== undefined) as unknown as Array<keyof RecType>
    })
  }

  get records() {
    return this._records
  }

  set records(records: RecType[]) {
    this._records = records
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

  hasChildren(): this is SetRequired<this, 'children'> {
    return (this.children ?? []).length > 0
  }

  hasParent(): this is SetNonNullable<this, 'parent'> {
    return !!this.parent
  }

  makePies(
    pieStart?: number,
    pieEnd?: number,
    padAngle?: number
  ) {
    this.eachBefore(node => makePie<T, RecType>(
      this,
      node,
      pieStart,
      pieEnd,
      padAngle
    ))
  }

  // makePies(
  //   pieStart: number,
  //   pieEnd: number,
  //   padAngle = 0
  // ) {
  //   this.eachBefore((node) => {
  //     if (node.depth === this.depth) {
  //       node.makePie(
  //         pieStart,
  //         pieEnd,
  //         padAngle
  //       )
  //     }
  //     else {
  //       node.makePie(
  //         node.parent!.pie.radians.start,
  //         node.parent!.pie.radians.end,
  //         node.parent!.pie.radians.padding
  //       )
  //     }
  //   })
  // }
}

function makePie<T, RecType>(that: Node<T, RecType>, node: Node<T, RecType>, pieStart: number | undefined, pieEnd: number | undefined, padAngle: number | undefined) {
  if (that.hasChildren()) {
    const children = that.children!
    const values = children.map(child => child.value)
    const pies = pie().startAngle(that.depth === node.depth ? (pieStart ?? that.pie.radians.start) : that.parent?.pie.radians.end)
      .endAngle(that.depth === node.depth ? (pieEnd ?? that.pie.radians.end) : that.parent?.pie.radians.end)
      .padAngle(that.depth === node.depth ? (padAngle ?? that.pie.radians.padding) : that.parent?.pie.radians.end)
      .value(d => d.value)(that.children)

    // .startAngle(pieStart ?? that.pie.radians.start)
    // .endAngle(pieEnd ?? that.pie.radians.end)
    // .padAngle(padAngle ?? that.pie.radians.padding)(values)
    pies.forEach((pieDatum, i) => {
      const pieObject = {
        start: pieDatum.startAngle,
        end: pieDatum.endAngle,
        padding: pieDatum.padAngle,
        midPoint: (pieDatum.startAngle + pieDatum.endAngle) / 2,
      }
      const radians = pieObject
      const degrees = {
        start: angleConverter.toPaper(pieObject.start),
        end: angleConverter.toPaper(pieObject.end),
        padding: angleConverter.toPaper(pieObject.padding),
        midPoint: angleConverter.toPaper(pieObject.midPoint),
      }

      that.children[i].pie = {
        radians,
        degrees,
      }
    })
  }
}
// this.prototype = hierarchy.prototype = {
//   constructor: this,
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
