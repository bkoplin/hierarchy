import safeStableStringify from 'safe-stable-stringify'
import type {
  FixedLengthArray, Get, JsonPrimitive, SetNonNullable, SetRequired, StringKeyOf, ValueOf,
} from 'type-fest'
import {
  clone,
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
import type { PieArcDatum, } from 'd3-shape'
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
        node.children = [
          ...node.children,
          nodeChild,
        ]
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
    .setValues()
}

function computeHeight(node: Node<any>) {
  let height = 0

  do node.height = height
  while ((node = node.parent) && (node.height < ++height))
}

class Angle extends Number {
  constructor(public radians: number) {
    super(radians)
    this.radians = radians
  }

  get degrees() {
    return angleConverter.toPaper(this.radians)
  }

  valueOf() {
    return this.radians
  }

  toJSON() {
    return {
      radians: this.radians,
      degrees: this.degrees,
    }
  }
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
  #valueFn: (values: RecType[]) => number = length
  #startAngle = new Angle(0)
  #endAngle = new Angle(2 * Math.PI)
  #padAngle = {
    radians: 0,
    degrees: 0,
  }

  #dims: Array<keyof RecType>

  value = 0
  #records: RecType[] = []
  constructor(data: T, keyFns: Array<KeyFn<RecType>>, dims: Array<keyof RecType>) {
    this.data = data
    this.depth = 0
    this.height = 0
    this.#keyFns = keyFns
    this.#dims = dims
  }

  get startAngle(): Angle {
    return this.#startAngle
  }

  set startAngle(radians: number) {
    this.#startAngle = new Angle(radians)
  }

  get endAngle(): Angle {
    return this.#endAngle
  }

  set endAngle(radians: number) {
    this.#endAngle = new Angle(radians)
  }

  get padAngle() {
    return this.#padAngle
  }

  set padAngle(radians: { radians: number; degrees: number }) {
    this.#padAngle = {
      radians: radians.radians,
      degrees: radians.radians * 180 / Math.PI,
    }
  }

  get valueFn() {
    return this.#valueFn
  }

  set valueFn(fn: (values: RecType[]) => number) {
    this.#valueFn = fn
  }

  setValues(callback?: (values: RecType[]) => number) {
    if (callback)
      this.valueFn = callback
    return this.each((node) => {
      if (callback)
        node.valueFn = callback
      node.value = node.valueFn(node.records)
    })
  }

  copy() {
    if (this.records.length === 0)
      this.setRecords()
    const theseDims = this.#dims.slice(this.depth)
    const theseKeyFns = this.#keyFns.slice(this.depth)
    const theseRecords = this.records
    const newH = hierarchy(
      theseRecords,
      ...theseDims.map((d, i) => [
        d,
        theseKeyFns[i],
      ])
    )

    newH.setValues(this.valueFn)
    return newH
  }

  toJSON() {
    return {
      ...clone(this),
      children: this.children,
      id: this.id,
      dim: this.dim,
      index: this.indexOf(),
      dimDepth: this.dimDepth(),
      startAngle: this.startAngle,
      endAngle: this.endAngle,
      padAngle: this.padAngle,
      minArcAngle: this.getMinArcAngle()
    }
  }

  exportJSON() {
    return JSON.parse(safeStableStringify(this.copy().eachAfter((node) => {
      delete node.data
    })))
  }

  count = node_count
  /**
   * @description Invokes the specified function for node and each descendant in breadth-first order, such that a given node is only visited if all nodes of lesser depth have already been visited, as well as all preceding nodes of the same depth. The specified function is passed the current descendant, the zero-based traversal index, and this node. If that is specified, it is the this contex
   * t of the callback.
   * _See_ https://github.com/d3/d3-hierarchy#node_each
   *
   */
  each(callback: (node: this, index?: number) => this, that?: this) {
    return node_each.bind(this)(
      callback,
      that
    )
  }

  /**
   * @description Invokes the specified function for node and each descendant in pre-order traversal, such that a given node is only visited after all of its ancestors have already been visited. The specified function is passed the current descendant, the zero-based traversal index, and this node. If that is specified, it is the this context of the callback.
   *
   * _See_ https://github.com/d3/d3-hierarchy#node_eachBefore
   *
   */
  eachBefore(callback: (node: this, index?: number) => this, that?: this): this {
    return node_eachBefore.bind(this)(
      callback,
      that
    )
  }

  /**
   * @description Invokes the specified function for node and each descendant in post-order traversal, such that a given node is only visited after all of its descendants have already been visited. The specified function is passed the current descendant, the zero-based traversal index, and this node. If that is specified, it is the this context of the callback.
   *
   * _See_ https://github.com/d3/d3-hierarchy#node_eachAfter
   *
   */
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
      const thisNodeDim = node.#dims?.[node.depth - 1]

      if (typeof thisNodeDim !== 'undefined') {
        node.id = node.data[0]
        node.dim = thisNodeDim
      }
      node.idPath = node.ancestors().map(ancestor => ancestor.id)
        .filter(v => v !== undefined) as unknown as JsonPrimitive[]
      node.dimPath = node.ancestors().map(ancestor => ancestor.dim)
        .filter(v => v !== undefined) as unknown as Array<keyof RecType>
    })
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

  set parent(parent: Node<T, RecType> | null) {
    if (parent instanceof Node)
      this.#parent = parent
  }

  hasChildren(): this is SetRequired<this, 'children'> {
    return (this.children ?? []).length > 0
  }

  hasParent(): this is SetNonNullable<this, 'parent'> {
    return !!this.parent
  }

  parentList() {
    if (this.hasParent() && this.parent?.hasChildren())
      return this.parent.children
    else return []
  }

  indexOf() {
    return this.parent?.children?.findIndex(c => c.id === this.id) ?? 0
  }

  dimDepth() {
    return this.#dims.indexOf(this.dim ?? '')
  }

  getMinArcAngle() {
    if (this.hasParent() && this.parent.hasChildren()) {
      const minArcAngle = Math.min(...this.parent.children.map(c => c.endAngle.radians - c.startAngle.radians))

      return {
        radians: minArcAngle,
        degrees: minArcAngle * 180 / Math.PI,
      }
    }
  }

  makePies(
    pieStart?: number,
    pieEnd?: number,
    piePadding?: number
  ) {
    const rootPieDepth = this.depth

    if (pieStart)
      this.startAngle = pieStart
    if (pieEnd)
      this.endAngle = pieEnd
    if (piePadding) {
      this.padAngle = {
        radians: piePadding,
        degrees: 0,
      }
    }

    return this.eachBefore((node) => {
      if (node.depth <= rootPieDepth || !node.hasParent() || !node.parent?.hasChildren())
        return
      const startAngle = node.parent.startAngle.radians
      const endAngle = node.parent.endAngle.radians
      const padAngle = node.parent.padAngle.radians
      const children = node.parent.children
      let pieGen = pie<Node<T, RecType>>().startAngle(startAngle)
        .endAngle(endAngle)
        .value(d => d.value)

      if (node.depth === rootPieDepth + 1) {
        pieGen = pie<Node<T, RecType>>().startAngle(startAngle)
          .endAngle(endAngle)
          .padAngle(padAngle)
          .value(d => d.value)
      }
      const pies = pieGen(children)

      pies.forEach((pieDatum, i) => {
        this.setPieAngles(
          node,
          i,
          pieDatum
        )
      })
    })
  }

  private setPieAngles(node: SetNonNullable<this, 'parent'>, i: number, pieDatum: PieArcDatum<any>) {
    if (node.parent.hasChildren()) {
      node.parent.children[i].startAngle = pieDatum.startAngle
      node.parent.children[i].endAngle = pieDatum.endAngle
      node.parent.children[i].padAngle = {
        radians: pieDatum.padAngle,
        degrees: 0,
      }
    }
  }
}
