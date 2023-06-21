import type {
  IterableElement,
  JsonObject,
  LiteralUnion,
  RequireAtLeastOne,
  RequireExactlyOne,
  SetRequired,
  StringKeyOf,
  ValueOf,
} from 'type-fest'
import {
  clone,
  difference,
  isEqual,
  isObjectLike,
  sortBy,
  uniq,
  zipObject,
} from 'lodash-es'
import type { Color, } from 'chroma-js'
import chroma from 'chroma-js'

import {
  contains, length, path,
} from 'rambdax'
import { pie, } from 'd3-shape'
import { scaleDiverging, } from 'd3-scale'
import paper from 'paper'
import { range, } from 'd3-array'

import type {
  A,
  I, N,
} from 'ts-toolbelt'
import type {
  HierarchyArguments, KeyFn,
} from '../types'
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
  T extends JsonObject,
  Args extends HierarchyArguments<T>
>(...args: Args) {
  const [
    values,
    ...keys
  ] = args
  const funcs = keys.map((p) => {
    if (typeof p === 'string') {
      const keyFn: KeyFn<T> = (d: T) => path(
        p,
        d
      )

      return keyFn
    }
    else {
      return p[1]
    }
  })
  const dims = keys.map((c) => {
    if (typeof c === 'string')
      return c as keyof T
    else return c[0]
  })
  const groupedData = group(
    values,
    ...funcs
  )
  const data = [
    undefined,
    groupedData,
  ] as const
  const parentIds: Array<ValueOf<T>> = []
  const root = new Node<T, 0, >(
    data,
    dims,
    0
  )
  const nodes = [ root, ]
  let node = nodes.pop()

  do {
    const children = node?.data[1]

    if (
      typeof node !== 'undefined' &&
      typeof dims[node?.depth - 1] === 'string' &&
      typeof funcs[node?.depth - 1] === 'function'
    ) {
      node.keyFn = funcs[node?.depth - 1]
      node.dim = dims[node?.depth - 1]
    }
    if (typeof children !== 'undefined') {
      const childArray = Array.from(children)

      childArray.reverse().forEach((child, i) => {
        const nodeChild = new Node(
          child,
          dims,
          (node?.depth ?? 0) + 1
        )

        // @ts-expect-error this is fine
        nodeChild.parent = node
        nodes.push(nodeChild)
        if (typeof node !== 'undefined') {
          if (typeof node.children === 'undefined')
            node.children = []
          node.children.push(nodeChild)
        }
      })
    }
    node = nodes.pop()
  } while ((node = nodes.pop()) !== undefined)

  return root
    .eachBefore((thisNode) => {
      let height = 0

      do thisNode.height = height
      while (
        // @ts-expect-error this is fine
        (thisNode = thisNode.parent) !== undefined &&
        thisNode.height < ++height
      )
    })
    .setIds()
    .setRecords()
    .setValues()
}

function nodeIsNode(node: unknown): node is Node {
  return node instanceof Node
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
  Datum,
  Dims extends A.Key[],
  ThisDepth extends number,
  Depth extends I.Iteration = I.IterationOf<ThisDepth>,
  RecType = JsonObject
> {
  constructor(
    /**
     * @description the `InternMap` resulting from the `d3.group` function at this level. The leaf nodes' `data` is the `RecType` passed to `hierarchy`
     * @type {Datum|RecType}
     * @memberof Node
     */
    public data: Datum,
    dims: Dims,
    /**
     * @description the depth of the node in the hierarchy. The root node has a depth of `0`. The leaf nodes have a depth of `dims.length + 1`
     * @type {number}
     * @memberof Node
     * @see {@link height}
     */
    public depth: ThisDepth
  ) {
    this.#dims = dims
    if (depth > 0)
      this.dim = dims[depth - 1]
  }

  /**
   * @description the child nodes of the node. Leaf nodes have no children
   * @memberof Node
   */
  #children?: undefined | Array<Node<Datum, Dims, I.Pos<I.Next<Depth>>, I.Next<Depth>>>

  color?: string
  colorScale?: BrewerKeys | Array<string | Color>
  colorScaleBy?: 'parentListOnly' | 'allNodesAtDim'
  colorScaleMode?: 'e' | 'q' | 'l' | 'k'
  colorScaleNum?: number

  /**
   * @description the `key` of the `RecType` at this level, which is the result of the `keyFn` passed to `hierarchy` at this level. The root node has a `dim` of `undefined`. The leaf nodes have a `dim` of `undefined`
   * @type {(StringKeyOf<RecType> | undefined)}
   * @memberof Node
   * @see {@link dimPath}
   * @see {@link #dims}
   * @see {@link #dims}
   */
  #dim: Dims[I.Pos<I.Prev<Depth>>] | undefined = undefined

  /**
   * @description the `dim` values of the node's ancestors from the root to this level
   * @type {ValueOf<RecType>[]}
   * @memberof Node
   */
  dimPath: Dims = []
  /**
   * @description the `key` array passed to the `hierarchy` function
   * @type {ValueOf<RecType>}
   * @see {@link #keyFns}
   * @see {@link dim}
   * @see {@link dimPath}
   *
   */
  #dims: Dims
  #endAngle = new Angle(2 * Math.PI)
  /**
   * @description the height of the node in the hierarchy. The root node has a height of `dims.length + 1`. The leaf nodes have a depth of `0`
   * @type {number}
   * @memberof Node
   *
   * @see {@link depths}
   */
  height = 0
  /**
   * @description the `id` of the node at this level, which is the result of the `keyFn` passed to `hierarchy` at this level. The root node has an id of `undefined`. The leaf nodes have an id of `undefined`
   * @type {(ValueOf<RecType> | undefined)}
   * @memberof Node
   * @see {@link idPath}
   * @see {@link #keyFns}
   */
  id: ValueOf<RecType> | undefined
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
   * @see {@link #dim}
   *
   */
  #keyFn: KeyFn<RecType> | undefined
  #padAngle = {
    radians: 0,
    degrees: 0,
  }

  #parent?: I.Pos<Depth> extends 0 ? undefined : Node<Datum, Dims, I.Pos<I.Prev<Depth>>, I.Prev<Depth>>

  #records: JsonObject[] = []
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

  get children() {
    return this.#children
  }

  set children(children) {
    this.#children = children
  }

  get dim() {
    return this.#dim
  }

  set dim(dim) {
    this.#dim = dim
  }

  get endAngle(): Angle {
    return this.#endAngle
  }

  set endAngle(radians: number) {
    this.#endAngle = new Angle(radians)
  }

  get keyFn() {
    return this.#keyFn
  }

  set keyFn(func) {
    this.#keyFn = func
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
    this.#parent = parent
  }

  /**
   * @description a getter that returns the `records` of the node at this level
   * @memberof Node
   */
  get records() {
    return this.#records
  }

  set records(records) {
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

  [Symbol.iterator] = function*(this: Node<Datum, Dims, ThisDepth, Depth>) {
    let next = [ this, ]
    let current = next.reverse()
    let node: Node<Datum, Dims, I.Pos<I.Next<Depth>>, I.Next<Depth>>
    let children

    do {
      next = []

      while ((node = current.pop()) !== undefined) {
        yield node
        if ((children = node.children) !== undefined) {
          children.forEach((child) => {
            next.push(child)
          })
        }
      }
      current = next.reverse()
    } while (next.length)
  }

  ancestorAt(depthOrDim: RequireExactlyOne<
      { depth?: number; dim?: LiteralUnion<keyof RecType, string> },
      'depth' | 'dim'
    >) {
    return this.ancestors().find((node) => {
      if (typeof depthOrDim.depth === 'number')
        return node.depth === depthOrDim.depth
      else return node.dim === depthOrDim.dim
    })
  }

  // getParent(node?: this): this['parent'] {
  //   return (node ?? this).parent
  // }

  /**
   * @description Returns the array of ancestors nodes, starting with this node, then followed by each parent up to the root.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#ancestors}
   * @memberof Node
   */
  ancestors() {
    type Ancestor = {
      0: Node<Datum, Dims, I.Pos<I.Prev<Depth>>, I.Prev<Depth>, RecType>
      1: Node<Datum, Dims, I.Pos<Depth>, Depth, RecType>
    }[ N.IsZero<I.Pos<Depth>> ]
    const nodes = [ this, ] as Ancestor[]
    let node = this as unknown as Ancestor

    while (typeof node.parent !== 'undefined') {
      nodes.push(node.parent)
      node = node?.parent
    }

    return nodes
  }

  /**
   * @description copies the node and all of its children, setting the records of the new node to the records of the original node. **Note**: This function *re-levels* the node, meaning that it creates new `height` and `depth` values so that *this* node becomes the root node of the new hierarchy
   * @returns {this}
   */
  copy() {
    if (this.records.length === 0)
      this.setRecords()
    const theseDims = this.#dims.slice(this.depth)
    const theseKeyFns = this.keyFn
    const theseRecords = this.records
    const newH = hierarchy(
      theseRecords,
      // @ts-expect-error this is fine
      ...theseDims.map((d, i) => [
        d,
        theseKeyFns[i],
      ])
    )

    // @ts-ignore
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
   * @param {RequireExactlyOne<{ depth?: number; dim?: this['dim'] }, 'depth' | 'dim'>} depthOrDim
   * @param {never[]} args
   * @returns {this[]}
   */
  descendantsAt(depthOrDim: RequireExactlyOne<
      { depth?: number; dim?: LiteralUnion<keyof RecType, string> },
      'depth' | 'dim'
    >) {
    const descendants = this.descendants()

    return descendants.filter((node) => {
      if (typeof depthOrDim.depth === 'number')
        return node.depth === depthOrDim.depth
      else return node.dim === depthOrDim.dim
    })
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
  each(callback: (node: this, traversalIndex?: number, context?: this) => void) {
    let index = -1

    for (const node of this) {
      callback(
        node as unknown as this,
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
  eachAfter(callback: (node: this, traversalIndex?: number) => void): this {
    const nodes: Array<typeof this> = [ this, ]
    let node: typeof this | undefined
    const next: Array<typeof this> = []
    let index = -1

    while ((node = nodes.pop()) !== undefined) {
      next.push(node)
      if (node.children)
        // @ts-expect-error this is fine
        node.children.forEach(child => nodes.push(child))
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
   * @description Invokes the specified function for node and each descendant in pre-order traversal, such that a given node is only visited after all of its ancestors have already been visited. The specified function is passed the current descendant, the zero-based traversal index, and this node. If that is specified, it is the this context of the callback.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#node_eachBefore}
   *
   */
  eachBefore(callback: (node: this, traversalIndex?: number) => void): this {
    const nodes: Array<typeof this> = [ this, ]
    let node: this | undefined = nodes[0]
    let index = -1

    while (typeof node !== 'undefined') {
      callback(
        node,
        ++index
      )
      if (node.children)
        // @ts-expect-error this is fine
        node.children.forEach(child => nodes.push(child))

      node = nodes.pop()
    }

    return this
  }

  /**
   * @description Returns the first node in the hierarchy from this node for which the specified filter returns a truthy value. undefined if no such node is found.
   * @param callback the filter function
   * @returns {this | undefined}
   */
  find(callback: (node: Node<Datum, Dims, ThisDepth, Depth>) => boolean) {
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

  hasChildren(): this is Node<RecType, ThisDepth, ThisHeight, Height, Depth> {
    return (this.children ?? []).length > 0
  }

  hasParent(): this is SetRequired<this, 'parent'> {
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
   */
  leaves<OnlyNodes extends boolean>(onlyNodes?: OnlyNodes) {
    type Leaf = {
      0: Node<RecType, ThisDepth, ThisHeight, I.IterationOf<0>, I.IterationOf<ThisHeight>>
      1: Node<RecType, ThisDepth, ThisHeight, I.IterationOf<1>, I.IterationOf<N.Sub<ThisHeight, 1>>>
    }[A.Extends<OnlyNodes, true>]
    const leaves: Leaf[] = []

    this.eachBefore((node) => {
      if (onlyNodes && node.hasChildren() && node.depth)
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
   */
  links(onlyNodes = false) {
    const links: Array<{
      source: Node<RecType, ThisDepth, ThisHeight, I.Next<Height>, I.Prev<Depth>>
      target: Node<RecType, ThisDepth, ThisHeight, Height, Depth>
    }> = []

    this.each((node) => {
      if (node !== this && (node.parent?.id || onlyNodes !== true)) {
        // Don't include the root's parent, if any.
        return {
          source: node.parent,
          target: node,
        }
      }
    })
    return links
  }

  /**
   * @description Returns the first `descendant` of this node that matches the `id` passed to the function. The second parameter is a boolean that determines whether the `id` must match exactly or if it can be a subset of the `id` of the node.
   * @param {ValueOf<RecType> | Array<ValueOf<RecType>> | Partial<RecType>} id An `id` value, a full or partial `idPath` value, or a lookup object
   * @param {[true]} exact whether to match the `id` parameter exactly, or to return the first node that contains the `id` parameter
   * @returns {this | undefined}
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
   * @returns {this[]}
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
   * @returns {this}
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
        if (!node.parent?.hasChildren())
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
            if (
              pieDatum.data.id === child.id &&
              pieDatum.data.dim === child.dim
            ) {
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
   * @returns {this[]}
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
   * @param {this} end the target node
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
      const thisScale = chroma.scale(colorScale as unknown as Parameters<chroma.ChromaStatic['scale']>[0])

      if (valueScaleOptions) {
        const {
          mode, num, scaleBy,
        } = valueScaleOptions

        this.colorScaleMode = mode ?? 'e'
        this.colorScaleBy = scaleBy ?? 'parentListOnly'
        if (typeof num !== 'undefined') { this.colorScaleNum = num }
        else if (this.colorScaleBy === 'allNodesAtDim') {
          this.colorScaleNum =
            this.colorScaleMode === 'e' ? nodesAtDimValues.length : 5
        }
        else {
          this.colorScaleNum =
            this.colorScaleMode === 'e' ? parentListValues.length : 5
        }
        const values = (
          this.colorScaleBy === 'allNodesAtDim' ?
            nodesAtDimValues :
            parentListValues
        ) as number[]
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
      | [BrewerKeys | Array<string | Color>]
      | [BrewerKeys | Array<string | Color>, ChromaLimitOptions]
      | BrewerKeys
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
      const thisNodeDim = node.dim

      if (typeof thisNodeDim !== 'undefined') {
        // @ts-expect-error this is fine
        node.id = node.data[0]
        node.dim = thisNodeDim
      }
      // @ts-expect-error this is fine
      node.idPath = node
        .ancestors()
        .map(ancestor => ancestor.id)
        .filter(v => v !== undefined)
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
    return this.each((node) => {
      node.records = node
        .leaves()
        .flatMap(leaf => leaf.data)
    })
  }

  /**
   * @description a function that sets the values of the node and all its children to the result of the callback function. If no callback is passed, the values are set to the length of the node's records at that level
   * @returns {this}
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
export function createNode(data, dims: Dims, depth: ThisDepth) {
  return new Node(
    data,
    dims,
    depth
  )
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
