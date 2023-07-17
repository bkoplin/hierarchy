import type { HierarchyNode, } from 'd3-hierarchy'
import chroma from 'chroma-js'
import * as R from 'rambdax'

import { scaleDiverging, } from 'd3-scale'
import { group, } from 'd3-array'
import {
  groupBy, map, max, meanBy, sumBy, uniq,
} from 'lodash-es'
import { median, } from 'rambdax'
import type {
  IterableElement,
  JsonArray,
  JsonObject,
  Merge,
  SetRequired,
  StringKeyOf,
  Writable,
} from 'type-fest'
import { pie, } from 'd3-shape'
import type { Writeable, } from 'zod'
import paper from 'paper'
import h from './hierarchy/index'

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

const aggregate: HierarchyNode['aggregate'] = function (
  aggFunction:
    | 'sum'
    | 'mean'
    | 'median'
    | 'mode'
    | 'count'
    | 'count (distinct)'
    | Function,
  valueField: string
) {
  return this.eachBefore((node) => {
    if (typeof aggFunction === 'function') {
      node.value = aggFunction(node.records)
    }
    else {
      node.value = rollupFunction(
        aggFunction ?? 'sum',
        (valueField as unknown) as keyof IterableElement<
          typeof node['records']
        >
      )(node.records)
    }
  })
}
const setNodeName: HierarchyNode['setNodeName'] = function (
  this: HierarchyNode,
  nameFields: string[]
) {
  return this.eachBefore((node) => {
    if (node.hasParent() && node.depth <= nameFields.length) {
      const nameField = nameFields[node.depth - 1]
      let data = node.records?.[0]

      if (Array.isArray(data))
        data = data[0]
      node.name = ((data?.[nameField] ?? node.id) as unknown) as string
      if (node.depth % 2 === 0 && node.dim !== node.parent.dim) {
        node.label = S.wrap(
          `${node.parent.name}: ${node.name}`,
          { width: 15, }
        )
      }

      else {
        node.label = S.wrap(
          `${node.name}`,
          { width: 15, }
        )
      }
    }
  })
}
const setColor: HierarchyNode['setColor'] = function (
  this: HierarchyNode,
  rules:
    | Array<keyof chroma.ChromaStatic['brewer']>
    | keyof chroma.ChromaStatic['brewer'],
  type?: 'byParent'
) {
  const depthTest = (node: unknown | Writeable<HierarchyNode>): node is Merge<
    Writeable<HierarchyNode>,
    { parent: Writeable<HierarchyNode> }
  > => {
    if (((node as Writeable<HierarchyNode>)?.depth ?? 0) === 0)
      return false
    else if (type === 'byParent')
      return (node as Writeable<HierarchyNode>)?.depth / 2 <= rules.length
    else return (node as Writeable<HierarchyNode>)?.depth <= rules.length
  }

  return this.eachBefore((node) => {
    const dims = R.uniq(this.records?.map(d => d[node.dim ?? '']) ?? []).sort() as string[]

    if (typeof rules === 'string') {
      const colorScale = R.zipObj(
        dims,
        chroma.scale(rules).colors(dims?.length ?? 1)
      )
      const color = colorScale[node.id as string]

      node.color = color
    }
    else if (depthTest(node) && Array.isArray(rules)) {
      if (type === 'byParent') {
        if (node.depth % 2 === 0) {
          node.color = node.parent.color
        }
        else {
          const ruleIndex = (node.depth - 1) / 2
          const colorScale = R.zipObj(
            dims,
            chroma.scale(rules[ruleIndex]).colors(dims?.length ?? 1)
          )
          const color = colorScale[node.id as string]

          node.color = color
        }
      }
      else {
        const colorScale = R.zipObj(
          dims,
          chroma.scale(rules[node.depth - 1]).colors(dims?.length ?? 1)
        )
        const color = colorScale[node.id as string]

        node.color = color
      }
    }
    else {
      node.color = null
    }
  })
}
const makePies: HierarchyNode['makePies'] = function (
  this: HierarchyNode,
  pieStart: number,
  pieEnd: number,
  piePadding = 0,
  paddingMaxDepth = 1
) {
  const depthTest = (node: unknown | typeof this): node is Merge<
    Writeable<HierarchyNode>,
    { parent: Writeable<HierarchyNode> }
  > => {
    if (
      ((node as Writeable<HierarchyNode>)?.depth ?? 0) === 0 ||
      ((node as Writeable<HierarchyNode>)?.height ?? 0) === 0
    )
      return false
    else return true
  }

  return this.eachBefore((node) => {
    if (depthTest(node)) {
      if (node.parent.hasChildren()) {
        const children = node.parent.children
        const minParentArcWidth = children.map(p => p.endAngle ?? 0 - p.startAngle ?? 0).reduce((a, b) => Math.min(
          a,
          b
        ))
        const nodePadAngle = node.depth === 1 ?
          piePadding :
          node.depth <= paddingMaxDepth ?
            R.min(
              node.parent.padAngle,
              minParentArcWidth
            ) / children.length :
            0
        const nodePieStart = node.depth === 1 ? (pieStart) : (node.parent.startAngle)
        const nodePieEnd = node.depth === 1 ? (pieEnd) : (node.parent.endAngle)
        const pies = pie<IterableElement<typeof node['children']>>()
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
              startAngle: startAngleIn, endAngle: endAngleIn, padAngle,
            } = p
            const startAngle = startAngleIn
            const endAngle = endAngleIn - padAngle

            node.padAngle = padAngle
            node.startAngle = startAngle
            node.endAngle = endAngle
            const arcWidthRadians = endAngleIn - startAngleIn - padAngle
            const halfAngle = arcWidthRadians / 2
            const rotationsRaw = (halfAngle + startAngle) / 2 / Math.PI
            const rotations = halfAngle + startAngle < 0 ?
              rotationsRaw - Math.ceil(rotationsRaw) :
              rotationsRaw - Math.floor(rotationsRaw)
            const paperMidPoint = angleConverter.toPaper(halfAngle + startAngle)

            node.midPointAngle = {
              radians: halfAngle + startAngle,
              degrees: ((halfAngle + startAngle) * 180) / Math.PI,
              paper: paperMidPoint,
              rotations,
              side: paperMidPoint < 0 ? paperMidPoint > -90 ? 'right' : 'left' : paperMidPoint > 90 ? 'left' : 'right',
            }
            node.nodeArcWidth = {
              radians: arcWidthRadians,
              degrees: (arcWidthRadians * 180) / Math.PI,
            }
            node.paperAngles = {
              startAngle: angleConverter.toPaper(node.startAngle),
              endAngle: angleConverter.toPaper(node.endAngle),
              padAngle: (node.padAngle * 180) / Math.PI,
              midPointAngle: paperMidPoint,
            }
          }
        })
      }
    }
  })
}
const leafNodes: HierarchyNode['leafNodes'] = function (this: HierarchyNode) {
  if (this.height === 1) {
    return (
      this.parent?.children ?? (([] as unknown) as Array<Writable<HierarchyNode>>)
    )
  }
  return this.descendants().filter(d => d.height === 1)
}
const descendantsAt: HierarchyNode['descendantsAt'] = function (
  this: HierarchyNode,
  level: number | string
) {
  if (typeof level === 'number')
    return this.descendants().filter(d => d.depth === level)
  return this.descendants().filter(d => d.dim === level)
}
const rootNodesAt: HierarchyNode['rootNodesAt'] = function (
  this: HierarchyNode,
  depthOrDim: number | string | null
) {
  const root = this.ancestorAt(0)

  if (typeof root === 'undefined' || depthOrDim === null)
    return []
  else if (typeof depthOrDim === 'number')
    return root.descendants().filter(d => d.depth === depthOrDim)
  return root.descendants().filter(d => d.dim === depthOrDim)
}
const collapseOnlyChildren: HierarchyNode['collapseOnlyChildren'] = function (this: HierarchyNode) {
  return this.eachAfter((node) => {
    if (node.hasChildren() && node.children?.length === 1) {
      node.children = R.path(
        [
          'children',
          0,
          'children',
        ],
        node
      )
      node.children?.forEach((child: Writable<typeof this>) => {
        child.depth = node.depth + 1
        child.height = node.height - 1
      })
    }
  })
}
const ancestorAt: HierarchyNode['ancestorAt'] = function (
  this: HierarchyNode,
  filter: string | number
) {
  if (typeof filter === 'number')
    return this.ancestors().find(d => d.depth === filter)
  else if (typeof filter === 'string')
    return this.ancestors().find(d => d.dim === filter)
}

h.prototype.setNodeName = setNodeName
h.prototype.setColor = setColor
h.prototype.aggregate = aggregate
h.prototype.makePies = makePies
h.prototype.leafNodes = leafNodes
h.prototype.descendantsAt = descendantsAt
h.prototype.rootNodesAt = rootNodesAt
h.prototype.hasChildren = hasChildren
h.prototype.hasParent = hasParent
h.prototype.collapseOnlyChildren = collapseOnlyChildren
h.prototype.ancestorAt = ancestorAt

export function hierarchy<T extends Record<string | number, any>>(
  data?: T[],
  dims?: Array<StringKeyOf<T> | Array<StringKeyOf<T>> | undefined>
) {
  const levels = (dims ?? []).filter(v => typeof v !== 'undefined' && v !== '').map(f => Array.isArray(f) ?
    R.filter(
      v => typeof v !== 'undefined' && v !== '',
      f
    ) :
    f)
  const g = R.apply(group)([
    data ?? [],
    ...levels.map(l => Array.isArray(l) ?
      R.pipe(
        R.paths(l),
        R.join('|')
      ) :
      R.path(l)),
  ])
  const root = (h(g) as unknown) as HierarchyNode

  root.eachBefore((node) => {
    const dim = levels?.[node.depth - 1]

    node.dim = dim ? `${dim}` : null
    node.id = node?.data?.[0] ?? null
    node.name = null
    node.color = null
    node.label = null
    node.angleConverter = angleConverter
    node.records = R.flatten(node.leaves().map(d => d.data))
    if (node.hasParent() && node.parent.hasChildren()) {
      node.parentList = node.parent.children
      node.parentId = node.parent.id as string | number | null
      node.dimPath = node
        .ancestors()
        .filter(d => d.depth > 0)
        .map(d => d.dim)
        .reverse()
      node.idPath = node
        .ancestors()
        .filter(d => d.depth > 0)
        .map(d => d.id as string | number | null)
        .reverse()
      node.datum = R.zipObj(
        node.dimPath as string[],
        node.idPath
      )
      node.parentIndex = node.parentList.findIndex(d =>
        R.equals(
          d.data,
          node.data
        ))
    }
    else {
      node.parentList = []
      node.parentId = null
      node.parentIndex = null
      node.dimPath = []
      node.idPath = []
      node.datum = null
    }
  })
  root.each((node) => {
    const base = node.ancestorAt(0)

    if (typeof base === 'undefined')
      node.parentIdList = []

    else
      node.parentIdList = R.uniq(base.rootNodesAt(node.depth).map(d => d.id as string | number | null))
  })
  root.setNodeName(levels)
  return root
}
export function rollupFunction(
  aggFunction:
  | 'sum'
  | 'mean'
  | 'median'
  | 'mode'
  | 'count'
  | 'count (distinct)',
  valueField: string
): (values: JsonObject[]) => number {
  return (values) => {
    const valueArray = values.map(v => v[valueField] || 0)
    const valuesAreNumbers = areAllNumbers(valueArray)

    if (aggFunction === 'sum' && valuesAreNumbers) {
      return sumBy(
        values,
        valueField
      ) as number
    }
    else if (aggFunction === 'mean' && valuesAreNumbers) {
      return meanBy(
        values,
        valueField
      ) as number
    }
    else if (aggFunction === 'median' && valuesAreNumbers) {
      return median(map(
        values,
        valueField
      ) as number[])
    }
    else if (aggFunction === 'mode' && valuesAreNumbers) {
      const g = groupBy(
        values,
        valueField
      )

      return max(objectEntries(g).map(([
        , arr,
      ]) => arr.length)) as number
    }
    else if (aggFunction === 'count') {
      return valueArray.length
    }
    else {
      return uniq(valueArray).length
    }
  }
}

function areAllNumbers(valueArray: number[] | unknown): valueArray is number[] {
  return (valueArray as JsonArray)?.every(v => typeof v === 'number') || false
}

function hasParent(this: Merge<
    HierarchyNode,
    { parent: SetRequired<HierarchyNode, 'children'> }
  >) {
  return (
    (this as HierarchyNode)?.parent !== undefined &&
    (this as HierarchyNode)?.parent !== null &&
    typeof (this as HierarchyNode)?.parent?.children !== 'undefined'
  )
}
function hasChildren(this: HierarchyNode | unknown) {
  return (this as HierarchyNode)?.children !== undefined
}
