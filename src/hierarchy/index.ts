import type {
  FixedLengthArray,
  Get,
  JsonObject,
  JsonPrimitive,
  LiteralUnion,
  RequireExactlyOne,
  SetNonNullable,
  SetRequired,
  StringKeyOf,
  ValueOf,
} from 'type-fest'
import {
  clone,
  difference,
  isEqual,
  isObjectLike,
  uniq,
  zipObject,
} from 'lodash-es'
import type { Color, } from 'chroma-js'
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
import node_count from './count.js'
import node_sum from './sum.js'
import node_sort from './sort.js'
import node_path from './path.js'
import node_links from './links.js'

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
      // angle: (radiansRaw / Math.PI) * 180 + 270,
      length: 1,
    })

    pt.angleInRadians = radiansRaw - Math.PI * 0.5

    return pt.angle
  },
}
export function hierarchy<
  T,
  KeyFns extends FixedLengthArray<
    [StringKeyOf<T>, KeyFn<T>] | StringKeyOf<T>,
    1
  >
>(values: T[], ...childrenFns: KeyFns): Node<T, [undefined, NestedMap<T, 1>]>
export function hierarchy<
  T,
  KeyFns extends FixedLengthArray<
    [StringKeyOf<T>, KeyFn<T>] | StringKeyOf<T>,
    2
  >
>(values: T[], ...childrenFns: KeyFns): Node<T, [undefined, NestedMap<T, 2>]>
export function hierarchy<
  T,
  KeyFns extends FixedLengthArray<
    [StringKeyOf<T>, KeyFn<T>] | StringKeyOf<T>,
    3
  >
>(values: T[], ...childrenFns: KeyFns): Node<T, [undefined, NestedMap<T, 3>]>
export function hierarchy<
  T,
  KeyFns extends FixedLengthArray<
    [StringKeyOf<T>, KeyFn<T>] | StringKeyOf<T>,
    4
  >
>(values: T[], ...childrenFns: KeyFns): Node<T, [undefined, NestedMap<T, 4>]>
export function hierarchy<
  T,
  KeyFns extends FixedLengthArray<
    [StringKeyOf<T>, KeyFn<T>] | StringKeyOf<T>,
    LiteralUnion<1 | 2 | 3 | 4, number>
  >
>(values: T[], ...childrenFns: KeyFns) {
  const funcs = childrenFns.map((c) => {
    if (Array.isArray(c)) { return c[1] }

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
    else return c[0]
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
  let node: Node<T, [undefined, NestedMap<T, L.Length<KeyFns>>]>

  node = nodes.pop() as Node<T, [undefined, NestedMap<T, L.Length<KeyFns>>]>
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
      while ((node = node.parent) && node.height < ++height)
    })
    .setIds()
    .setRecords()
    .setValues()
}

/**
 * @description a class that represents an angle in radians, but can be converted to degrees
 * @extends {Number}
 * @class Angle
 * @example
 * const angle = new Angle(Math.PI)
 * angle.degrees // 180
 * angle.radians // Math.PI
 * angle.valueOf() // Math.PI
 * angle.toJSON() // { radians: Math.PI, degrees: 180 }
 */
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

type BrewerKeys = keyof chroma.ChromaStatic[ 'brewer' ]

export class Node<
  RecType = JsonObject,
  Datum = Map<undefined, NestedMap<[keyof RecType, RecType], 2>>
> {
  [Symbol.iterator] = function*(this: Node<RecType, Datum>) {
    let next = [ this, ]
    let current = next.reverse()

    do {
      next = []
      let node = current.pop()

      while (node) {
        yield node
        if (node.children) {
          node.children.forEach((child) => {
            next.push(child)
          })
        }
        node = current.pop()
      }
      current = next.reverse()
    } while (next.length)
  }

  /**
   * @description the `id` of the node at this level, which is the result of the `keyFn` passed to `hierarchy` at this level. The root node has an id of `undefined`. The leaf nodes have an id of `undefined`
   * @type {(ValueOf<RecType> | undefined)}
   * @memberof Node
   */
  id: JsonPrimitive | undefined
  /**
   * @description the `id` values of the node's ancestors from the root to this level
   * @type {ValueOf<RecType>[]}
   * @memberof Node
   */
  idPath: Array<ValueOf<RecType>> = []
  /**
   * @description the `dim` values of the node's ancestors from the root to this level
   * @type {ValueOf<RecType>[]}
   * @memberof Node
   */
  dimPath: Array<keyof RecType> = []
  /**
   * @description the `key` of the `RecType` at this level, which is the result of the `keyFn` passed to `hierarchy` at this level. The root node has a `dim` of `undefined`. The leaf nodes have a `dim` of `undefined`
   * @type {(StringKeyOf<RecType> | undefined)}
   * @memberof Node
   */
  dim: StringKeyOf<RecType> | string | keyof RecType | undefined
  /**
   * @description the `InternMap` resulting from the `d3.group` function at this level. The leaf nodes' `data` is the `RecType` passed to `hierarchy`
   * @type {Datum|RecType}
   * @memberof Node
   */
  data: Datum
  /**
   * @description the depth of the node in the hierarchy. The root node has a depth of `0`. The leaf nodes have a depth of `dims.length + 1`
   * @type {number}
   * @memberof Node
   */
  depth: number
  /**
   * @description the height of the node in the hierarchy. The root node has a height of `dims.length + 1`. The leaf nodes have a depth of `0`
   * @type {number}
   * @memberof Node
   */
  height: number
  #parent: null | Node<RecType, Datum> = null
  color?: string
  /**
   * @description the child nodes of the node. Leaf nodes have no children
   * @type {Array<Node<RecType, Datum>>|undefined}
   * @memberof Node
   */
  children?: Array<Node<RecType, Datum>>
  #keyFns: Array<KeyFn<RecType>>
  #valueFn: (values: RecType[]) => number = length
  /**
   * @description the `Angle` at which the arc of the node starts. If you have not invoked the `makePies` method, the `radians` and `degrees` for this key will be `0`
   */
  #startAngle = new Angle(0)
  #endAngle = new Angle(2 * Math.PI)
  #padAngle = {
    radians: 0,
    degrees: 0,
  }

  #dims: Array<keyof RecType>
  /**
   * @description the value of the node, as set by the aggregate function passsed to `this.valueFn`
   * @type {number}
   * @memberof Node
   */
  value = 0
  #records: RecType[] = []

  constructor(
    data: Datum,
    keyFns: Array<KeyFn<RecType>>,
    dims: Array<keyof RecType>
  ) {
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
      degrees: (radians.radians * 180) / Math.PI,
    }
  }

  get valueFn() {
    return this.#valueFn
  }

  set valueFn(fn: (values: RecType[]) => number) {
    this.#valueFn = fn
  }

  /**
   * @description a function that sets the values of the node and all its children to the result of the callback function. If no callback is passed, the values are set to the length of the node's records at that level
   * @returns {Node<RecType, Datum>}
   */
  setValues(callback?: (values: RecType[]) => number) {
    if (callback)
      this.valueFn = callback
    return this.each((node) => {
      if (callback)
        node.valueFn = callback
      node.value = node.valueFn(node.records)
    })
  }

  /**
   * @description copies the node and all of its children, setting the records of the new node to the records of the original node. **Note**: This function *re-levels* the node, meaning that it creates new `height` and `depth` values so that *this* node becomes the root node of the new hierarchy
   * @returns {Node<RecType, Datum>}
   */
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

  /**
   * @description supports the `JSON.stringify` function. Not all functions and properties return from this function.
   */
  toJSON() {
    return {
      ...clone(this),
      children: this.children,
      id: this.id,
      dim: this.dim,
      indexOf: this.indexOf(),
      dimIndexOf: this.dimIndexOf(),
      startAngle: this.startAngle,
      endAngle: this.endAngle,
      padAngle: this.padAngle,
      minArcAngle: this.minArcAngle(),
    }
  }

  count = node_count

  /**
 * @description Invokes the specified function for node and each descendant in breadth-first order, such that a given node is only visited if all nodes of lesser depth have already been visited, as well as all preceding nodes of the same depth. The specified function is passed the current descendant, the zero-based traversal index, and this node. If that is specified, it is the this contex
 * t of the callback.
 * _See_ https://github.com/d3/d3-hierarchy#node_each
 *
 */
  each(callback: (
    node: Node<RecType, Datum>,
    traversalIndex?: number,
    context?: this,
  ) => void) {
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

  /**
   * @description Invokes the specified function for node and each descendant in pre-order traversal, such that a given node is only visited after all of its ancestors have already been visited. The specified function is passed the current descendant, the zero-based traversal index, and this node. If that is specified, it is the this context of the callback.
   *
   * _See_ https://github.com/d3/d3-hierarchy#node_eachBefore
   *
   */
  eachBefore(callback: (node: Node<RecType, Datum>, traversalIndex?: number) => void): this {
    const nodes: Array<Node<RecType, Datum>> = [ this, ]
    let node: Node<RecType, Datum> | undefined = nodes[0]
    let index = -1

    while (typeof node !== 'undefined') {
      callback(
        node,
        ++index
      )
      if (node.children)
        node.children.forEach(child => nodes.push(child))

      node = nodes.pop()
    }

    return this
  }

  /**
   * @description Invokes the specified function for node and each descendant in post-order traversal, such that a given node is only visited after all of its descendants have already been visited. The specified function is passed the current descendant, the zero-based traversal index, and this node. If that is specified, it is the this context of the callback.
   *
   * _See_ https://github.com/d3/d3-hierarchy#node_eachAfter
   *
   */
  eachAfter(callback: (node: Node<RecType, Datum>, traversalIndex?: number) => void): this {
    const nodes: Array<Node<RecType, Datum>> = [ this, ]
    let node: Node<RecType, Datum> | undefined = nodes[0]
    const next: Array<Node<RecType, Datum>> = []
    let index = -1

    while (node) {
      next.push(node)
      if (node.children)
        node.children.forEach(child => nodes.push(child))

      node = nodes.pop()
    }
    node = next.pop()
    while (node) {
      callback(
        node,
        ++index
      )
      node = next.pop()
    }

    return this
  }

  /**
   * @description Returns the first `descendant` of this node that matches the `id` passed to the function. The second parameter is a boolean that determines whether the `id` must match exactly or if it can be a subset of the `id` of the node.
   * @param {ValueOf<RecType> | Array<ValueOf<RecType>> | Partial<RecType>} id An `id` value, a full or partial `idPath` value, or a lookup object
   * @param {[true]} exact whether to match the `id` parameter exactly, or to return the first node that contains the `id` parameter
   * @returns {Node<RecType, Datum> | undefined}
   */
  lookup(
    id: ValueOf<RecType> | Array<ValueOf<RecType>> | Partial<RecType>,
    exact = true
  ) {
    const desc = this.descendants()

    if (Array.isArray(id)) {
      if (exact) {
        return desc.find(node =>
          id.length === node.idPath.length &&
            difference(
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
        return desc.find(node =>
          isEqual(
            zipObject(
              node.dimPath,
              node.idPath
            ),
            id
          ))
      }
      else {
        return desc.find(node =>
          contains(
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

  /**
   * @description Returns the array of all `descendant` nodes of this node that match the `id` passed to the function. The second parameter is a boolean that determines whether the `id` must match exactly or if it can be a subset of the `id` of the node.
   * @param {Array<ValueOf<RecType>|string> | Array<Array<ValueOf<RecType>|string>> | Array<Partial<RecType>>} id An `id` value, a full or partial `idPath` value, or a lookup object
   * @param {[true]} exact whether to match the `id` parameter exactly, or to return the first node that contains the `id` parameter
   * @returns {Node<RecType, Datum>[]}
   */
  lookupMany(
    ids:
      | Array<ValueOf<RecType> | string>
      | Array<Array<ValueOf<RecType> | string>>
      | Array<Partial<RecType>>,
    exact = true
  ) {
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

  /**
   * @description Returns the first node in the hierarchy from this node for which the specified filter returns a truthy value. undefined if no such node is found.
   * @param callback the filter function
   * @returns {Node<RecType, Datum> | undefined}
   */
  find(callback: (node: Node<RecType, Datum>) => boolean) {
    const index = -1

    for (const node of this) {
      if (callback(node))
        return node
    }
  }

  sum(...args: Parameters<typeof node_sum>) {
    return node_sum.bind(this)(...args)
  }

  sort(...args: Parameters<typeof node_sort>) {
    return node_sort.bind(this)(...args)
  }

  path(end: this): this[] {
    return node_path.bind(this)(end)
  }

  /**
   * @description Returns the array of ancestors nodes, starting with this node, then followed by each parent up to the root.
   *
   * _See_ https://github.com/d3/d3-hierarchy#ancestors
   * @returns {Node<RecType, Datum>[]}
   * @memberof Node
   */
  ancestors() {
    const nodes: Array<Node<RecType, Datum>> = [ this, ]
    let node = nodes[0]

    while (node.parent) {
      nodes.push(node.parent)
      node = node.parent
    }

    return nodes
  }

  /**
   * @description Returns the array of descendant nodes, starting with this node, then followed by each child in topological order.
   *
   * _See_ https://github.com/d3/d3-hierarchy#descendants
   * @returns {Node<RecType, Datum>[]}
   */
  descendants() {
    return Array.from(this)
  }

  /**
   * @description Returns the descendants of this node at the specified `depth` or `dim`.
   * @param {RequireExactlyOne<{ depth?: number; dim?: Node<RecType, Datum>['dim'] }, 'depth' | 'dim'>} depthOrDim
   * @param {never[]} args
   * @returns {Node<RecType, Datum>[]}
   */
  descendantsAt(depthOrDim: RequireExactlyOne<
      { depth?: number; dim?: Node<RecType, Datum>['dim'] },
      'depth' | 'dim'
    >) {
    return this.descendants().filter((node) => {
      if (typeof depthOrDim.depth === 'number')
        return node.depth === depthOrDim.depth
      else return node.dim === depthOrDim.dim
    }) as this[]
  }

  leaves() {
    const leaves: Array<Node<RecType, Datum>> = []

    this.eachBefore((node) => {
      if (!node.children)
        leaves.push(node)
    })
    return leaves
  }

  links(...args: Parameters<typeof node_links>) {
    return node_links.bind(this)(...args)
  }

  setColors(colorScales: Array<BrewerKeys | Array<string | Color>> | BrewerKeys | Array<string | Color>) {
    if (isBrewerColor(colorScales)) { this.color = this.getColor(colorScales) }
    else if (isHexColorScale(colorScales)) { this.color = this.getColor(colorScales) }
    else {
      this.each((node) => {
        const thisLevelScale: BrewerKeys | Array<string | Color> | undefined = colorScales[node.dimIndexOf()]

        if (thisLevelScale)
          node.color = node.getColor(thisLevelScale)
      })
    }
  }

  getColor(scale?: Array<string | Color> | BrewerKeys) {
    if (typeof this.dim === 'undefined')
      return undefined
    const root = this.ancestors().reverse()[0]
    const ids = uniq(root
      .descendantsAt({ dim: this.dim, })
      .map(d => d.id)) as string[]
    const colors = chroma.scale(scale ?? chroma.brewer.Spectral).colors(ids.length)
    const colorObject = zipObject(
      ids,
      colors
    )

    return colorObject[this.id as string]
  }

  ancestorAt(depthOrDim: RequireExactlyOne<
      { depth?: number; dim?: Node<RecType, Datum>['dim'] },
      'depth' | 'dim'
    >) {
    return this.ancestors().find((node) => {
      if (typeof depthOrDim.depth === 'number')
        return node.depth === depthOrDim.depth
      else return node.dim === depthOrDim.dim
    })
  }

  /**
   * @description a method that sets the `records` property of each node in the hierarchy to the array of records contained in the leaf nodes for that node
   */
  setRecords() {
    return this.each(node =>
      (node.records = node.leaves().flatMap((leaf): RecType => leaf.data as unknown as RecType)))
  }

  /**
   * @description a method that sets the `id` and `dim` properties of each node in the hierarchy using each node's `depth` property and the `dims` property of the hierarchy
   */
  setIds() {
    return this.each((node) => {
      const thisNodeDim = node.#dims?.[node.depth - 1]

      if (typeof thisNodeDim !== 'undefined') {
        node.id = node.data[0]
        node.dim = thisNodeDim
      }
      node.idPath = node
        .ancestors()
        .map(ancestor => ancestor.id)
        .filter(v => v !== undefined) as unknown as JsonPrimitive[]
      node.dimPath = node
        .ancestors()
        .map(ancestor => ancestor.dim)
        .filter(v => v !== undefined) as unknown as Array<keyof RecType>
    })
  }

  /**
   * @description a getter that returns the `records` of the node at this level
   * @memberof Node
   */
  get records() {
    return this.#records
  }

  set records(records: RecType[]) {
    this.#records = records
  }

  /**
   * @description the `keyFn` for this node, as passed to the `hierarchy` function
   * @readonly
   * @memberof Node
   */
  get keyFn() {
    return this.#keyFns[this.depth - 1]
  }

  get parent() {
    return this.#parent
  }

  set parent(parent: Node<RecType, Datum> | null) {
    if (parent instanceof Node)
      this.#parent = parent
  }

  hasChildren(): this is SetRequired<this, 'children'> {
    return (this.children ?? []).length > 0
  }

  hasParent(): this is SetNonNullable<this, 'parent'> {
    return !!this.parent
  }

  /**
   * @description the sibling nodes of this node (the `children` associated with this node's `parent`)
   * @returns {Node<RecType, Datum>[]}
   */
  parentList() {
    if (this.hasParent() && this.parent?.hasChildren())
      return this.parent.children
    else return []
  }

  /**
   * @description the index of this node in its parent's `children` array
   * @returns {number} the index of this node in its parent's `children` array
   */
  indexOf() {
    return this.parent?.children?.findIndex(c => c.id === this.id) ?? -1
  }

  /**
   * @description the "depth" of this node according to the `keyFns` originally passed to the `hierarchy` function
   * @returns {number} the index of this node's `dim` in the `dims` array
   */
  dimIndexOf() {
    return this.#dims.indexOf(this.dim ?? '')
  }

  minArcAngle() {
    if (this.hasParent() && this.parent.hasChildren()) {
      const minArcAngle = Math.min(...this.parent.children.map(c => c.endAngle.radians - c.startAngle.radians))

      return {
        radians: minArcAngle,
        degrees: (minArcAngle * 180) / Math.PI,
      }
    }
  }

  /**
   * @description a method that makes pies from the `d3.pie` constructor for this node and its descendants. The `startAngle`, `endAngle`, and `padAngle` properties of the `d3.pie` constructor are set to the `startAngle`, `endAngle`, and `padAngle` properties of this node, respectively.
   *
   * **Note:** If you do not invoke the `setValues` method before invoking this method, the `value` property of the `d3.pie` constructor is set to the `records.length` of each node.
   * @param {[number]} pieStart the start angle in **radians** for the `root` pie
   * @param {[number]} pieEnd the end angle in **radians** for the `root` pie
   * @param {[number]} piePadding the padding angle in **radians** for the `root` pie
   * @returns {Node<RecType, Datum>}
   */
  makePies(pieStart?: number, pieEnd?: number, piePadding?: number) {
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
      if (
        node.depth <= rootPieDepth ||
        !node.hasParent() ||
        !node.parent?.hasChildren()
      )
        return
      const startAngle = node.parent.startAngle.radians
      const endAngle = node.parent.endAngle.radians
      const padAngle = node.parent.padAngle.radians
      const children = node.parent.children
      let pieGen = pie<Node<RecType, Datum>>()
        .startAngle(startAngle)
        .endAngle(endAngle)
        .value(d => d.value)

      if (node.depth === rootPieDepth + 1) {
        pieGen = pie<Node<RecType, Datum>>()
          .startAngle(startAngle)
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

  private setPieAngles(
    node: SetNonNullable<this, 'parent'>,
    i: number,
    pieDatum: PieArcDatum<any>
  ) {
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

function isHexColorScale(colorScales: unknown | Array<string | Color>): colorScales is Array<string | Color> {
  return Array.isArray(colorScales) && colorScales.every(color => typeof color === 'string' && chroma.valid(color))
}

function isBrewerColor(anyString: unknown | BrewerKeys): anyString is BrewerKeys {
  return (typeof anyString === 'string') && ((anyString ?? '') in chroma.brewer)
}
