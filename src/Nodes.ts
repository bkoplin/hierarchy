import {
  equals,
  filterObject,
  intersection,
  min,
  omit,
  uniq,
  zipObj,
} from 'rambdax'
import type { LiteralUnion, } from 'type-fest'
import type {
  ChromaStatic, Color,
} from 'chroma-js'
import chroma from 'chroma-js'
import { pie, } from 'd3-shape'
import { objectEntries, } from '@antfu/utils'
import type {
  L, N,
} from 'ts-toolbelt'
import type { KeyFn, } from './types'

type Ancestors<ThisNode, AncestorList extends L.List = []> = ThisNode extends { parent: unknown; depth: number }
  ? N.Greater<ThisNode['depth'], 0> extends 1
    ? Ancestors<ThisNode['parent'], L.Append<AncestorList, ThisNode>>
    : L.Append<AncestorList, ThisNode>
  : never

type Descendants<ThisNode, DescendantList extends L.List = []> = ThisNode extends { children: unknown[]; height: number }
  ? N.Greater<ThisNode['height'], 0> extends 1
    ? Descendants<ThisNode['children'][number], L.Append<DescendantList, ThisNode>>
    : L.Append<DescendantList, ThisNode>
  : never

export class Node<
  Datum = any,
  KeyFunctions extends ReadonlyArray<KeyFn<Datum>> = readonly [KeyFn<Datum>],
  Depth extends L.KeySet<0, L.Length<KeyFunctions>> = 0,
  Height extends N.Sub<
    L.Length<KeyFunctions>,
    Depth
  > = N.Sub<
    L.Length<KeyFunctions>,
    Depth
  >
> {
  constructor(
    public readonly keyFns: KeyFunctions,
    public records: Datum[],
    public depth: Depth,
    public readonly id = undefined as any,
    public height = (keyFns.length - depth) as Height
  ) {
    this.name = this.id
    this.colorScaleNum = this.records.length
    this.value = this.records.length
  }

  color = '#cccccc'
  colorScale:
  | LiteralUnion<keyof ChromaStatic['brewer'], string>
  | Array<string | Color> = 'Spectral'

  colorScaleBy:
  | 'allNodesAtDimIds'
  | 'allNodesAtDimValues'
  | 'parentListIds'
  | 'parentListValues' = 'allNodesAtDimIds'

  colorScaleMode: 'e' | 'q' | 'l' | 'k' = 'e'
  colorScaleNum: number
  startAngle: number = 0
  endAngle: number = 2 * Math.PI
  name: this['id']
  padAngle: number = 0
  #parent?: Node<Datum, KeyFunctions, N.Sub<Depth, 1>> = undefined

  value: number

  children: Array<Node<Datum, KeyFunctions, N.Add<Depth, 1>>> = []

  addChild(child: this['children'][number]) {
    if (this.height > 0 && !!child) {
      if (typeof this.children === 'undefined')
        this.children = []
      this.children.push(child)
      // @ts-ignore
      child.parent = this
    }
  }

  valueFunction = rec => rec.records.length

  get keyFn() {
    return this.keyFns[this.depth]
  }

  get dim() {
    if (typeof this.keyFn === 'undefined')
      return ''
    else if (typeof this.keyFn === 'string' || typeof this.keyFn === 'number' || typeof this.keyFn === 'symbol')
      return `${this.keyFn}`
    else return this.keyFn[0]
  }

  get idObject() {
    return { [this.dim]: this.id, }
  }

  idPath(options: {
    noRoot?: boolean
  } = { noRoot: false, }) {
    const { noRoot, } = options
    const ids = [ this.id, ]
    let node = this

    while (
      typeof node !== 'undefined' &&
      'parent' in node &&
      typeof node.parent !== 'undefined'
    ) {
      const parentId = node.parent.id

      if (noRoot === false || node.parent.depth !== 0)
        ids.push(parentId)

      // @ts-ignore
      node = node.parent
    }

    return ids
  }

  pedigree(options: { noRoot?: boolean } = { noRoot: false, }) {
    return this.idPath(options)
  }

  get parent() {
    return this.#parent
  }

  set parent(parent) {
    this.#parent = parent
  }

  get type() {
    if (this.depth === 0)
      return 'leaf'
    else if (this.height === 0)
      return 'root'
    else return 'node'
  }

  *[Symbol.iterator](): Generator<
    L.UnionOf<Descendants<this>>,
    void,
    unknown
    > {
    let node = this
    let current
    let next = [ node, ]
    let children
    let i: number
    let n: number

    do {
      current = next.reverse()
      next = []
      while ((node = current.pop()) !== undefined) {
        yield node
        if ((children = node?.children) !== undefined)
          for (i = 0, n = children.length; i < n; ++i) next.push(children[i])
      }
    } while (next.length)
  }

  ancestorAt(depthOrDim) {
    const node = this.ancestors().find((ancestor) => {
      return (
        ('depth' in depthOrDim && depthOrDim.depth === ancestor.depth) ||
        ('dim' in depthOrDim && depthOrDim.dim === ancestor.dim)
      )
    })

    return node
  }

  ancestors(): Ancestors<this> {
    const nodes = [ this, ] as Ancestors<this>
    let node = this

    while (
      typeof node !== 'undefined' &&
      'parent' in node &&
      typeof node.parent !== 'undefined'
    ) {
      nodes.push(node.parent)
      node = node.parent
    }
    return nodes
  }

  descendants() {
    return Array.from(this)
  }

  descendantsAt(depthOrDim) {
    return this.descendants().filter((node) => {
      const {
        depth: paramDepth, dim: paramDim,
      } = depthOrDim

      if (typeof paramDepth === 'number')
        return node?.depth === paramDepth
      else return node?.dim === paramDim
    })
  }

  each(callback: (node, index?: number) => void): this {
    let index = -1

    for (const node of this) {
      callback(
        node,
        ++index
      )
    }

    return this
  }

  eachAfter(callback: (node, index?: number) => void): this {
    const nodes = [ this, ]
    const next = []
    let children
    let i
    let index = -1
    let node

    while ((node = nodes.pop()) !== undefined) {
      next.push(node)
      if ((children = node?.children) !== undefined) {
        children.forEach((child) => {
          if (child)
            nodes.push(child as unknown as (typeof nodes)[number])
        })
      }
    }
    while ((node = next.pop()) !== undefined) {
      callback(
        // @ts-ignore
        node,
        ++index
      )
    }

    return this
  }

  eachBefore(callback: (node, index?: number) => void): this {
    const nodes = [ this, ]
    let children
    let i
    let index = -1
    let node

    while ((node = nodes.pop()) !== undefined) {
      callback(
        node,
        ++index
      )
      if ((children = node?.children) !== undefined) {
        for (i = children.length - 1; i >= 0; --i) {
          const child = children[i]

          if (child)
            nodes.push(child as unknown as (typeof nodes)[number])
        }
      }
    }
    return this
  }

  find(callback: (node, index?: number) => boolean) {
    return this.descendants().find(callback)
  }

  hasParent() {
    return this?.depth > 0
  }

  isRoot() {
    return this?.depth === 0
  }

  isLeaf() {
    return this?.height === 0
  }

  /**
   * @description Returns the array of leaf nodes for this node
   *
   * @see {@link https://github.com/d3/d3-hierarchy#leaves}
   */
  leaves(): Array<Node<Datum, KeyFunctions, KeyFunctions['length']>> {
    const leaves = []

    this.eachBefore((node) => {
      if (!node?.height)
        leaves.push(node)
    })
    return leaves
  }

  links(this) {
    const links = []

    this.each((node) => {
      // Don't include the root's parent, if any.
      links.push({
        source: node.parent,
        target: node,
      })
    })
    return links
  }

  makePies(
    pieStart: number = 0,
    pieEnd: number = 2 * Math.PI,
    piePadding = 0,
    paddingMaxDepth = 1
  ) {
    this.eachBefore((node) => {
      if (node.hasParent()) {
        const parent = node.parent
        const children = parent.children
        const minParentArcWidth = children
          // @ts-ignore
          .map(p => p.endAngle ?? 0 - p.startAngle ?? 0)
          .reduce((a, b) => Math.min(
            a,
            b
          ))
        const nodePadAngle =
          node.depth === 1 ?
            piePadding :
            node.depth <= paddingMaxDepth ?
              min(
                node.parent.padAngle,
                minParentArcWidth
              ) / children.length :
              0
        const nodePieStart =
          node.depth === 1 ? pieStart : node.parent.startAngle
        const nodePieEnd = node.depth === 1 ? pieEnd : node.parent.endAngle
        const pies = pie<(typeof children)[number]>()
          .startAngle(nodePieStart)
          .endAngle(nodePieEnd)
          .padAngle(nodePadAngle)
          .sort((a, b) => {
            // const sortA = a.leaves()[0]?.data?.[inputs.value.sourceName.value]
            if ((a.value ?? 0) > (b.value ?? 0))
              return pieStart > Math.PI ? 1 : -1
            if ((a.value ?? 0) < (b.value ?? 0))
              return pieStart > Math.PI ? -1 : 1
            return 0
          })
          .value(d => d.value ?? 1)(children)

        pies.forEach((p, i) => {
          if (p.data.id === node.id) {
            const {
              startAngle: startAngleIn,
              endAngle: endAngleIn,
              padAngle,
            } = p
            const startAngle = startAngleIn
            const endAngle = endAngleIn - padAngle

            node.padAngle = padAngle
            node.startAngle = startAngle
            node.endAngle = endAngle
          }
        })
      }
    })
    return this
  }

  path(end) {
    let start = this
    const ancestor = leastCommonAncestor(
      start,
      end
    )
    const nodes = [ start, ]

    while (start !== ancestor) {
      start = start.parent
      nodes.push(start)
    }
    const k = nodes.length

    while (end !== ancestor) {
      nodes.splice(
        k,
        0,
        end
      )
      end = end?.parent
    }
    return nodes
  }

  setColor(args) {
    this.each((node) => {
      if (!(typeof node === 'undefined' || node === null)) {
        objectEntries(args).forEach(([
          colorKey,
          value,
        ]) => {
          if (node[colorKey] !== value && typeof value !== 'undefined')
            node[colorKey] = value
        })

        if (
          (node.colorScaleBy === 'allNodesAtDimIds' ||
            node.colorScaleBy === 'parentListIds') &&
          !node.isRoot()
        ) {
          let values: string[] = node.parent!.children!.map(n => n.id)

          if (node.colorScaleBy === 'allNodesAtDimIds') {
            const ancestor = node.ancestorAt({ depth: 0, })

            values = uniq(ancestor
              .descendants()
              .filter(d => d.dim === node.dim)
              .map(n => n.id))
          }
          node.color = zipObj(
            values,
            chroma.scale(node.colorScale).colors(values.length)
          )[node.id]
        }
        else if (node.hasParent()) {
          let values: number[] = node.parent!.children!.map(n => n.value)

          if (node.colorScaleBy === 'allNodesAtDimValues') {
            const ancestor = node.ancestorAt({ depth: 0, })

            values = uniq(ancestor
              .descendants()
              .filter(d => d.dim === node.dim)
              .map(n => n.value))
          }
          const colorValues = chroma.limits(
            values,
            node.colorScaleMode,
            node.colorScaleNum
          )

          node.color = chroma
            .scale(node.colorScale)
            .domain(colorValues)(node.value)
            .hex()
        }
      }
    })
    return this
  }

  setValueFunction(valueFn: (node) => number) {
    const index = -1

    for (const node of this) {
      if (typeof node === 'undefined' || node === null)
        return
      node.valueFunction = valueFn
      node.setValues()
    }
    return this
  }

  setValues() {
    this.each(node => (node.value = node.valueFunction(node)))

    return this
  }

  toJSON() {
    const node = filterObject(
      (v) => {
        return v !== undefined && typeof v !== 'function'
      },
      this
    )

    if (node.height === 0) {
      return omit(
        [ 'children', ],
        node
      )
    }

    return omit(
      [ 'parent', ],
      node
    )
  }
}

function leastCommonAncestor<ANode extends Node, BNode extends Node>(
  a: ANode,
  b: BNode
) {
  if (equals(
    a,
    b
  ))
    return a
  const aNodes = a.ancestors()
  const bNodes = b.ancestors()
  const [ c, ] = intersection(
    aNodes,
    bNodes
  )

  return c ?? null
}
