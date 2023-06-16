import type {
  Except,
  FixedLengthArray,
  Get,
  JsonObject,
  JsonPrimitive,
  RequireAtLeastOne,
  RequireExactlyOne,
  Simplify,
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
import type {
  L, N,
} from 'ts-toolbelt'
import {
  contains, length, prop,
} from 'rambdax'
import { pie, } from 'd3-shape'
import { scaleDiverging, } from 'd3-scale'
import paper from 'paper'
import { range, } from 'd3-array'
import type {
  KeyFn, NestedMap,
} from '../array/types'
import { group, } from '../array/group'
import node_sum from './sum.js'
import node_path from './path.js'

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
  T extends JsonObject | string,
  KeyFns extends FixedLengthArray<StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>], 1 | 2 | 3 | 4> = FixedLengthArray<StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>], 2>,
  Ret = Node<
    T,
    FixedLengthArray<KeyFn<T>, L.Length<KeyFns>>,
    NestedMap<T, L.Length<KeyFns>>
  >
>(values: T[], ...childrenFns: KeyFns): Ret {
  const funcs = childrenFns.map((c) => {
    if (Array.isArray(c)) {
      return c[1]
    }
    else {
      return (d: T): Get<T, typeof c> =>
        prop(
          c,
          d
        ) as unknown as Get<T, typeof c>
    }
  }) as unknown as FixedLengthArray<KeyFn<T>, L.Length<KeyFns>>
  const dims = childrenFns.map((c) => {
    if (typeof c === 'string')
      return c
    else return c[0]
  }) as unknown as FixedLengthArray<keyof T, L.Length<KeyFns>>
  const data = [
    undefined,
    group(
      values,
      ...funcs
    ),
  ] as const
  const childrenFn = (d: typeof Map) => {
    return Array.isArray(d) ? d[1] : null
  }
  const root = new Node(
    data,
    funcs,
    dims
  )
  const nodes = [ root, ]
  let node: Ret

  node = nodes.pop() as Ret
  while (typeof node !== 'undefined') {
    const children = childrenFn(node.data)

    if (children) {
      const childArray = Array.from(children)

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

  toJSON() {
    return {
      radians: this.radians,
      degrees: this.degrees,
    }
  }

  valueOf() {
    return this.radians
  }
}

type BrewerKeys = StringKeyOf<chroma.ChromaStatic['brewer']>

type ChromaLimitOptions = RequireAtLeastOne<{
  mode?: 'e' | 'q' | 'l' | 'k'
  num?: number
}> & { scaleBy?: 'parentListOnly' | 'allNodesAtDim' }

export class Node<
  RecType extends JsonObject | string = JsonObject,
  KeyFns extends FixedLengthArray<
    KeyFn<RecType>,
    1 | 2 | 3 | 4
  > = FixedLengthArray<KeyFn<RecType>, 2>,
  Datum = NestedMap<[keyof RecType, RecType], L.Length<KeyFns>>
> {
  constructor(
    /**
     * @description the `InternMap` resulting from the `d3.group` function at this level. The leaf nodes' `data` is the `RecType` passed to `hierarchy`
     * @type {Datum|RecType}
     * @memberof Node
     */
    public data: Datum,
    keyFns: KeyFns,
    dims: FixedLengthArray<keyof RecType, L.Length<KeyFns>>
  ) {
    this.#keyFns = keyFns
    this.#dims = dims
  }

  /**
   * @description the child nodes of the node. Leaf nodes have no children
   * @type {Array<Node<RecType, KeyFns, Datum>>|undefined}
   * @memberof Node
   */
  children?: Array<Node<RecType, KeyFns, Datum>>
  color?: string
  colorScale?: BrewerKeys | Array<string | Color>
  colorScaleBy?: 'parentListOnly' | 'allNodesAtDim'
  colorScaleMode?: 'e' | 'q' | 'l' | 'k'
  colorScaleNum?: number
  /**
   * @description the depth of the node in the hierarchy. The root node has a depth of `0`. The leaf nodes have a depth of `dims.length + 1`
   * @type {number}
   * @memberof Node
   * @see {@link height}
   */
  depth: L.UnionOf<N.Range<0, N.Add<L.Length<KeyFns>, 1>>> = 0
  /**
   * @description the `key` of the `RecType` at this level, which is the result of the `keyFn` passed to `hierarchy` at this level. The root node has a `dim` of `undefined`. The leaf nodes have a `dim` of `undefined`
   * @type {(StringKeyOf<RecType> | undefined)}
   * @memberof Node
   * @see {@link dimPath}
   * @see {@link #dims}
   * @see {@link #dims}
   */
  dim: StringKeyOf<RecType> | string | keyof RecType | undefined
  /**
   * @description the `dim` values of the node's ancestors from the root to this level
   * @type {ValueOf<RecType>[]}
   * @memberof Node
   */
  dimPath: Array<keyof RecType> = []
  /**
   * @description the `keyFn` array passed to the `hierarchy` function
   * @type {KeyFns}
   * @see {@link #keyFns}
   * @see {@link dim}
   * @see {@link dimPath}
   *
   */
  #dims: FixedLengthArray<keyof RecType, L.Length<KeyFns>>
  #endAngle = new Angle(2 * Math.PI)
  /**
   * @description the height of the node in the hierarchy. The root node has a height of `dims.length + 1`. The leaf nodes have a depth of `0`
   * @type {number}
   * @memberof Node
   *
   * @see {@link depths}
   */
  height: this['depth'] = 0
  /**
   * @description the `id` of the node at this level, which is the result of the `keyFn` passed to `hierarchy` at this level. The root node has an id of `undefined`. The leaf nodes have an id of `undefined`
   * @type {(ValueOf<RecType> | undefined)}
   * @memberof Node
   * @see {@link idPath}
   * @see {@link #keyFns}
   */
  id: JsonPrimitive | undefined
  /**
   * @description the `id` values of the node's ancestors from the root to this level
   * @type {ValueOf<RecType>[]}
   * @memberof Node
   * @see {@link id}
   */
  idPath: Array<ValueOf<RecType>> = []

  /**
   * @description the `keyFn` array passed to the `hierarchy` function
   * @type {KeyFns}
   * @see {@link #dims}
   *
   */
  #keyFns: KeyFns
  #padAngle = {
    radians: 0,
    degrees: 0,
  }

  #parent?: Node<RecType, KeyFns, Datum>

  #records: RecType[] = []
  /**
   * @description the `Angle` at which the arc of the node starts. If you have not invoked the `makePies` method, the `radians` and `degrees` for this key will be `0`
   */
  #startAngle = new Angle(0)
  /**
   * @description the value of the node, as set by the aggregate function passsed to `this.valueFn`
   * @type {number}
   * @memberof Node
   * @see {@link setValues}
   * @see {@link valueFn}
   */
  value = 0
  /**
   * @description the aggregate function to determine the value of the node
   * @private
   * @see {@link setValues}
   */
  #valueFn: (values: RecType[]) => number = length

  get endAngle(): Angle {
    return this.#endAngle
  }

  set endAngle(radians: number) {
    this.#endAngle = new Angle(radians)
  }

  /**
   * @description the `keyFn` for this node, as passed to the `hierarchy` function
   * @readonly
   * @memberof Node
   */
  get keyFn() {
    return this.#keyFns[this.depth - 1]
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

  get parent() {
    return this.#parent
  }

  set parent(parent) {
    if (parent instanceof Node)
      this.#parent = parent
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

  get startAngle(): Angle {
    return this.#startAngle
  }

  set startAngle(radians: number) {
    this.#startAngle = new Angle(radians)
  }

  /**
   * @description the aggregate function to determine the value of the node
   * @see {@link setValues}
   */
  get valueFn() {
    return this.#valueFn
  }

  /**
   * @description the aggregate function to determine the value of the node
   * @see {@link setValues}
   */
  set valueFn(fn: (values: RecType[]) => number) {
    this.#valueFn = fn
  }

  [Symbol.iterator] = function* (this: Node<RecType, KeyFns, Datum>) {
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

  ancestorAt(depthOrDim: RequireExactlyOne<
    { depth?: number; dim?: Node<RecType, KeyFns, Datum>['dim'] },
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
   * @returns {Node<RecType, KeyFns, Datum>[]}
   * @memberof Node
   */
  ancestors() {
    const nodes: Array<Node<RecType, KeyFns, Datum>> = [ this, ]
    let node = nodes[0]

    while (node.parent) {
      nodes.push(node.parent)
      node = node.parent
    }

    return nodes
  }

  /**
   * @description copies the node and all of its children, setting the records of the new node to the records of the original node. **Note**: This function *re-levels* the node, meaning that it creates new `height` and `depth` values so that *this* node becomes the root node of the new hierarchy
   * @returns {Node<RecType, KeyFns, Datum>}
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

  count() {
    this.setRecords()
    this.each(node => (node.value = node.records.length))
  }

  /**
   * @description Returns the array of descendant nodes, starting with this node, then followed by each child in topological order.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#descendants}
   */
  descendants() {
    return Array.from(this)
  }

  /**
   * @description Returns the descendants of this node at the specified `depth` or `dim`.
   * @param {RequireExactlyOne<{ depth?: number; dim?: Node<RecType, KeyFns, Datum>['dim'] }, 'depth' | 'dim'>} depthOrDim
   * @param {never[]} args
   * @returns {Node<RecType, KeyFns, Datum>[]}
   */
  descendantsAt(depthOrDim: RequireExactlyOne<
      { depth?: number; dim?: Node<RecType, KeyFns, Datum>['dim'] },
      'depth' | 'dim'
    >) {
    return this.descendants().filter((node) => {
      if (typeof depthOrDim.depth === 'number')
        return node.depth === depthOrDim.depth
      else return node.dim === depthOrDim.dim
    }) as this[]
  }

  /**
   * @description the "depth" of this node according to the `keyFns` originally passed to the `hierarchy` function
   * @returns {number} the index of this node's `dim` in the `dims` array
   */
  dimIndexOf() {
    return this.#dims.indexOf(this.dim ?? '')
  }

  /**
   * @description Invokes the specified function for node and each descendant in breadth-first order, such that a given node is only visited if all nodes of lesser depth have already been visited, as well as all preceding nodes of the same depth. The specified function is passed the current descendant, the zero-based traversal index, and this node. If that is specified, it is the this contex
   * t of the callback.
   * @see {@link https://github.com/d3/d3-hierarchy#node_each}
   *
   */
  each(callback: (
    node: this,
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
   * @description Invokes the specified function for node and each descendant in post-order traversal, such that a given node is only visited after all of its descendants have already been visited. The specified function is passed the current descendant, the zero-based traversal index, and this node. If that is specified, it is the this context of the callback.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#node_eachAfter}
   *
   */
  eachAfter(callback: (
    node: this,
    traversalIndex?: number,
  ) => void): this {
    const nodes: Array<typeof this> = [ this, ]
    let node: typeof this | undefined = nodes[0]
    const next: Array<typeof this> = []
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
   * @description Invokes the specified function for node and each descendant in pre-order traversal, such that a given node is only visited after all of its ancestors have already been visited. The specified function is passed the current descendant, the zero-based traversal index, and this node. If that is specified, it is the this context of the callback.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#node_eachBefore}
   *
   */
  eachBefore(callback: (
    node: this,
    traversalIndex?: number,
  ) => void): this {
    const nodes: Array<typeof this> = [ this, ]
    let node: this | undefined = nodes[0]
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
   * @description Returns the first node in the hierarchy from this node for which the specified filter returns a truthy value. undefined if no such node is found.
   * @param callback the filter function
   * @returns {Node<RecType, KeyFns, Datum> | undefined}
   */
  find(callback: (node: Node<RecType, KeyFns, Datum>) => boolean) {
    const index = -1

    for (const node of this) {
      if (callback(node))
        return node
    }
  }

  /**
   * @description if the node has a color, this will return the hex value of that color at the specified alpha value. If the node does not have a color, this will return undefined.
   * @param {number} [alpha=1] the alpha value to use
   * @see {@link https://www.vis4.net/chromajs/#color-alpha}
   * @see {@link https://www.vis4.net/chromajs/#color-hex}
   * @example
   * this.getColorHexAlpha(0.5); // "#ffa50080" if the node's color is 'orange'
   * @see {@link getColorRgbAlpha}
  */
  getColorHexAlpha(alpha = 1) {
    if (this.color) {
      return chroma(this.color).alpha(alpha)
        .hex()
    }
  }

  /**
   * @description if the node has a color, this will return the RGBA array value of that color at the specified alpha value. If the node does not have a color, this will return undefined.
   * @param {number} [alpha=1] the alpha value to use
   * @see {@link https://www.vis4.net/chromajs/#color-alpha}
   * @see {@link https://www.vis4.net/chromajs/#color-rgba}
   * @example
   * this.getColorRgbAlpha(0.5); // [255,165,0,0.5] if the node's color is 'orange'
  * @see {@link getColorHexAlpha}
   */
  getColorRgbAlpha(alpha = 1) {
    if (this.color) {
      return chroma(this.color).alpha(alpha)
        .rgba()
    }
  }

  hasChildren(): this is Simplify<Except<this, 'children'> & { children: Array<Node<RecType, KeyFns, Datum>> }> {
    return (this.children ?? []).length > 0
  }

  hasParent(): this is Simplify<Except<this, 'parent'> & { parent: Node<RecType, KeyFns, Datum> }> {
    return !!this.parent
  }

  /**
   * @description the index of this node in its parent's `children` array
   * @returns {number} the index of this node in its parent's `children` array
   */
  indexOf() {
    return this.parent?.children?.findIndex(c => c.id === this.id) ?? -1
  }

  /**
   *
   * @param {boolean} [onlyNodes = false] return only leaves that are true nodes -- i.e. that have children that are not nodes but still have `id` and `dim` properties
   * @returns {Node<RecType, KeyFns, Datum>[]}
   */
  leaves(onlyNodes = false) {
    const leaves: Array<Node<RecType, KeyFns, Datum>> = []

    this.eachBefore((node) => {
      if (onlyNodes && !!node.children && !node.children[0].children)
        leaves.push(node)
      else if (!node.children && !onlyNodes)
        leaves.push(node)
    })
    return leaves
  }

  /**
   * @description Returns an array of links for this node and its descendants, where each link is an object that defines source and target properties. The source of each link is the parent node, and the target is a child node.
   * @see {@link https://github.com/d3/d3-hierarchy#links}
   * @param {boolean} [onlyNodes = false] return only leaves that are true nodes -- i.e. that have children that are not nodes but still have `id` and `dim` properties
   * @return {Array<Record<'source'|'target', Node<RecType, KeyFns, Datum>>>}
   */
  links(onlyNodes = false) {
    const links: Array<{
      source: Node<RecType, KeyFns, Datum>
      target: Node<RecType, KeyFns, Datum>
    }> = []

    this.each((node) => {
      if (onlyNodes && typeof node.id === 'undefined') {
      }
      else if (node !== this && node.parent?.id) {
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
   * @description Returns the first `descendant` of this node that matches the `id` passed to the function. The second parameter is a boolean that determines whether the `id` must match exactly or if it can be a subset of the `id` of the node.
   * @param {ValueOf<RecType> | Array<ValueOf<RecType>> | Partial<RecType>} id An `id` value, a full or partial `idPath` value, or a lookup object
   * @param {[true]} exact whether to match the `id` parameter exactly, or to return the first node that contains the `id` parameter
   * @returns {Node<RecType, KeyFns, Datum> | undefined}
   * @see {@link lookupMany}
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
   * @returns {Node<RecType, KeyFns, Datum>[]}
   * @see {@link lookup}
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
        return desc.find(node =>
          (ids as Array<Array<ValueOf<RecType>>>).some(id =>
            id.length === node.idPath.length &&
              difference(
                node.idPath,
                id
              ).length === 0))
      }
      else {
        return desc.find(node =>
          (ids as Array<Array<ValueOf<RecType>>>).some(id => difference(
            id,
            node.idPath
          ).length === 0))
      }
    }
    else if (isObjectLike(firstId)) {
      if (exact) {
        return desc.find(node =>
          (ids as Array<Partial<RecType>>).some(id =>
            isEqual(
              zipObject(
                node.dimPath,
                node.idPath
              ),
              id
            )))
      }
      else {
        return desc.find(node =>
          (ids as Array<Partial<RecType>>).some(id =>
            contains(
              id,
              zipObject(
                node.dimPath,
                node.idPath
              )
            )))
      }
    }
    return desc.find(node =>
      (ids as Array<ValueOf<RecType>>).includes(node.id as ValueOf<RecType>))
  }

  /**
   * @description a method that makes pies from the `d3.pie` constructor for this node and its descendants. The `startAngle`, `endAngle`, and `padAngle` properties of the `d3.pie` constructor are set to the `startAngle`, `endAngle`, and `padAngle` properties of this node, respectively.
   *
   * **Note:** If you do not invoke the `setValues` method before invoking this method, the `value` property of the `d3.pie` constructor is set to the `records.length` of each node.
   * @param {[number]} pieStart the start angle in **radians** for the `root` pie
   * @param {[number]} pieEnd the end angle in **radians** for the `root` pie
   * @param {[number]} piePadding the padding angle in **radians** for the `root` pie
   * @returns {Node<RecType, KeyFns, Datum>}
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
      if (node.depth > rootPieDepth && node.hasParent()) {
        if (!node.parent.hasChildren())
          return
        const startAngle = node.parent.startAngle.radians
        const endAngle = node.parent.endAngle.radians
        const padAngle = node.parent.padAngle.radians
        const children = node.parent.children
        let pieGen = pie<typeof node>()
          .startAngle(startAngle)
          .endAngle(endAngle)
          .value(d => d.value)

        if (node.depth === rootPieDepth + 1) {
          pieGen = pie<typeof node>()
            .startAngle(startAngle)
            .endAngle(endAngle)
            .padAngle(padAngle)
            .value(d => d.value)
        }

        const pies = pieGen(children)

        children.forEach((child) => {
          pies.forEach((pieDatum) => {
            if (pieDatum.data.id === child.id && pieDatum.data.dim === child.dim) {
              child.startAngle = pieDatum.startAngle
              child.endAngle = pieDatum.endAngle
              child.padAngle = {
                radians: pieDatum.padAngle,
                degrees: 0,
              }
            }
          })
        })
      }
    })
  }

  /**
   * @description return the minimum angle of the arcs of the `children` of this node's `parent`. Useful for arc generation. If this node doens't have a parent or the parent doesn't have children, returns `undefined`.
   * @returns {InstanceType<Angle>}
   * @see {@link makePies}
   */
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
     * @description the sibling nodes of this node (the `children` associated with this node's `parent`)
     * @returns {this['id'][]}
     * @see {@link parentList}
     * @see {@link id}
     */
  parentIdList() {
    return this.parentList().map(node => node.id)
  }

  /**
   * @description the sibling nodes of this node (the `children` associated with this node's `parent`)
   * @returns {Node<RecType, KeyFns, Datum>[]}
   * @see {@link parentIdList}
   * @see {@link id}
   */
  parentList() {
    if (this.hasParent() && this.parent?.hasChildren())
      return this.parent.children
    else return []
  }

  /**
   * @description Returns the shortest path through the hierarchy from this node to the specified target node. The path starts at this node, ascends to the least common ancestor of this node and the target node, and then descends to the target node. This is particularly useful for hierarchical edge bundling.
   * @see {@link https://github.com/d3/d3-hierarchy#node_path}
   * @param {Node<RecType, KeyFns, Datum>} end the target node
   * @param {boolean} [noRoot=false] whether to exclude the root node from the returned path array
   * @returns {this[]}
   */
  path(end: this, noRoot = false): this[] {
    return node_path
      .bind(this)(end)
      .filter(node => !noRoot || node.depth > 0)
  }

  /**
   * @description sets the color for this node.
   * @param colorScale a tuple where the first element is either a Brewer key or an array of colors, and the second element is an optional ChromaLimitOptions object
   */
  setColor(
    colorScale: BrewerKeys | Array<string | Color>,
    valueScaleOptions?: ChromaLimitOptions
  ) {
    if (typeof this.dim !== 'undefined') {
      this.colorScale = colorScale
      const root = this.ancestors().reverse()[0]
      const nodesAtDimUniqueIds = uniq(root.descendantsAt({ dim: this.dim, }).map(d => d.id)) as string[]
      const nodesAtDimValues = root
        .descendantsAt({ dim: this.dim, })
        .map(d => d.value)
        .sort()
      const parentListValues = this.parentList()
        .map(d => d.value)
        .sort()
      const thisScale = chroma.scale(colorScale as unknown as Parameters<chroma.ChromaStatic[ 'scale' ]>[ 0 ])

      if (valueScaleOptions) {
        const {
          mode, num, scaleBy,
        } = valueScaleOptions

        this.colorScaleMode = mode ?? 'e'
        this.colorScaleBy = scaleBy ?? 'parentListOnly'
        if (typeof num !== 'undefined')
          this.colorScaleNum = num

        else if (this.colorScaleBy === 'allNodesAtDim')
          this.colorScaleNum = this.colorScaleMode === 'e' ? nodesAtDimValues.length : 5
        else
          this.colorScaleNum = this.colorScaleMode === 'e' ? parentListValues.length : 5
        const values = (this.colorScaleBy === 'allNodesAtDim' ? nodesAtDimValues : parentListValues) as number[]
        const chromaLimits = chroma.limits(
          values,
          this.colorScaleMode,
          this.colorScaleNum
        )
        const colors = thisScale.classes(chromaLimits)

        this.color = colors(this.value).hex()
      }
      else {
        const colors = thisScale.classes(range(nodesAtDimUniqueIds.length))

        this.color = colors(nodesAtDimUniqueIds.indexOf(this.id as string)).hex()
      }
    }
  }

  /**
   * @description sets the colors for this node and all of its descendants.
   * @see {@link setColor}
   * @param colorScales
   */
  setColors(colorScales: Array<
      [BrewerKeys | Array<string | Color>] | [BrewerKeys | Array<string | Color>, ChromaLimitOptions] | BrewerKeys
    >) {
    this.each((node) => {
      const thisLevelScale = colorScales[node.dimIndexOf()]

      if (thisLevelScale) {
        if (typeof thisLevelScale === 'string') { this.setColor(thisLevelScale) }
        else {
          this.setColor(
            thisLevelScale[0],
            thisLevelScale[1]
          )
        }
      }
    })
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
   * @description a method that sets the `records` property of each node in the hierarchy to the array of records contained in the leaf nodes for that node
   */
  setRecords() {
    return this.each(node =>
      (node.records = node
        .leaves()
        .flatMap((leaf): RecType => leaf.data as unknown as RecType)))
  }

  /**
   * @description a function that sets the values of the node and all its children to the result of the callback function. If no callback is passed, the values are set to the length of the node's records at that level
   * @returns {Node<RecType, KeyFns, Datum>}
   * @see {@link valueFn}
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

  sort() {
    return this.eachBefore((node) => {
      if (node.children) {
        node.children = sortBy(
          node.children,
          'value'
        )
      }
    })
  }

  sum(...args: Parameters<typeof node_sum>) {
    return node_sum.bind(this)(...args)
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
}

function isHexColorScale(colorScales: unknown | Array<string | Color>): colorScales is Array<string | Color> {
  return (
    Array.isArray(colorScales) &&
    colorScales.every(color => typeof color === 'string' && chroma.valid(color))
  )
}

function isBrewerColor(anyString: unknown | BrewerKeys): anyString is BrewerKeys {
  return typeof anyString === 'string' && (anyString ?? '') in chroma.brewer
}
