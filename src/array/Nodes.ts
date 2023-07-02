import {
  filterObject, length, pipe, prop, uniq, zipObj,
} from 'rambdax'
import type {
  LiteralUnion, StringKeyOf,
} from 'type-fest'
import type {
  ChromaStatic, Color,
} from 'chroma-js'
import { iterator, } from './iterator'
import type {
  BaseNode, NodeType, NumericUnion,
} from './types'
import chroma from 'chroma-js'

export abstract class Node<Datum> {
  constructor(
    public depth: number,
    public height: number,
    public records: Datum[],
    public id: any,
    public dim: any
  ) {
    this.name = id
    this.value = this.valueFunction(this)
    this.color = undefined
  }

  [Symbol.iterator]: this[typeof Symbol.iterator] = iterator

  children = []

  color?: string
  colorScale: StringKeyOf<ChromaStatic['brewer']> | Array<string | Color> = 'Spectral'
  colorScaleBy: 'parentListIds' | 'allNodesAtDimIds' | 'parentListValues' | 'allNodesAtDimValues' = 'allNodesAtDimIds'
  colorScaleMode: 'e' | 'q' | 'l' | 'k' = 'e'
  colorScaleNum: number | undefined = undefined
  name: any
  parent = undefined

  value = 0

  /**
   * The function to set the value of the node
   * @default pipe(prop('records'), length)
   */
  valueFunction: (args_0: this) => number = pipe(
    prop('records'),
    length
  )

  addChild(child) {
    if (this.height > 0)
      this.children?.push(child)
  }

  ancestorAt(depthOrDim) {
    return this.ancestors().find((node) => {
      if (this === node)
        return false
      if (typeof depthOrDim.depth === 'number')
        return node.depth === depthOrDim.depth
      else return node.dim === depthOrDim.dim
    })
  }

  ancestors() {
    const nodes = [ this, ]
    let node = this

    while (typeof node !== 'undefined' && typeof node.parent !== 'undefined') {
      nodes.push(node.parent)
      node = node.parent
    }

    return nodes
  }

  descendants() {
    return Array.from(this)
  }

  each(callback) {
    let index = -1

    for (const node of this) {
      callback(
        node,
        ++index
      )
    }

    return this
  }

  eachAfter(callback) {
    const nodes = [ this, ]
    const next = []
    let children
    let i
    let index = -1
    let node

    while ((node = nodes.pop()) !== undefined) {
      next.push(node)
      if ((children = node?.children) !== undefined)
        for (i = 0, n = children.length; i < n; ++i) nodes.push(children[i])
    }
    while ((node = next.pop()) !== undefined) {
      callback(
        node,
        ++index
      )
    }

    return this
  }

  eachBefore(callback) {
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
      if ((children = node?.children) !== undefined)
        for (i = children.length - 1; i >= 0; --i) nodes.push(children[i])
    }
    return this
  }

  hasChildren() {
    return this?.height > 0 && typeof this?.children !== 'undefined'
  }

  hasParent() {
    return this?.depth > 0 && typeof this?.parent !== 'undefined'
  }

  leaves() {
    const leaves = []

    this.eachBefore((node) => {
      if (!node.children)
        leaves.push(node)
    })
    return leaves
  }

  links() {
    const links = []

    this.each((node) => {
      if (node !== this) {
        // Don't include the root's parent, if any.
        links.push({
          source: node.parent,
          target: node,
        })
      }
    })
    return links
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
      end = end.parent
    }
    return nodes
  }

  setColor(
    this: NodeType<Datum, 5>,
    ...args: Parameters<BaseNode<Datum>['setColor']>
  ) {
    const [
      scale,
      scaleBy,
      scaleMode,
      scaleNum,
    ] = args

    this.each((node) => {
      if (typeof scaleBy !== 'undefined')
        node.colorScaleBy = scaleBy
      if (typeof scale !== 'undefined')
        node.colorScale = scale
      if (typeof scaleMode !== 'undefined')
        node.colorScaleMode = scaleMode
      if (typeof scaleNum !== 'undefined')
        node.colorScaleNum = scaleNum
      if (!node.hasParent())
        return
      if (node.colorScaleBy === 'allNodesAtDimIds' || node.colorScaleBy === 'parentListIds') {
        let values = node.parent.children.map(n => n.id)

        if (node.colorScaleBy === 'allNodesAtDimIds') {
          values = uniq(node.ancestorAt({ depth: 0, }).descendants()
            .filter(d => d.dim === node.dim)
            .map(n => n.id))
        }
        node.color = zipObj(
          values,
          chroma.scale(node.colorScale).colors(values.length)
        )[node.id]
      }
    })
    return this
  }

  setValueFunction(valueFn) {
    this.each(node => (node.valueFunction = valueFn))
  }

  setValues() {
    this.each(node => (node.value = node.valueFunction(node)))
  }

  toJSON(this: NodeType<Datum, number>) {
    const node = filterObject(
      v => v !== undefined && typeof v !== 'function',
      this
    )

    delete node.parent
    // if (node.height === 0)
    //   delete node.children
    return node
  }
}
export class LeafNode<Datum> extends Node<Datum> {
  constructor(depth: number, records: Datum[], id, dim) {
    super(
      depth,
      0,
      records,
      id,
      dim
    )
    delete this.children
  }

  type = 'leaf'
}
export class RootNode<Datum> extends Node<Datum> {
  constructor(height: number, records: Datum[]) {
    super(
      0,
      height,
      records,
      undefined,
      undefined
    )
    delete this.parent
    delete this.id
    delete this.name
    delete this.dim
  }

  type = 'root'
}
export function createRootNode<Datum, Height extends NumericUnion<1, 7>>(height: LiteralUnion<Height, number>, records: Datum[]): BaseNode<Datum, 0, Height, Height> {
  return new RootNode(
    height,
    records
  )
}
export class HierarchyNode<Datum> extends Node<Datum> {
  constructor(
    depth: number,
    height: number,
    records: Datum[],
    id: any,
    dim: any
  ) {
    super(
      depth,
      height,
      records,
      id,
      dim
    )
  }

  type = 'node'
}

function leastCommonAncestor(a, b) {
  if (a === b)
    return a
  const aNodes = a.ancestors()
  const bNodes = b.ancestors()
  let c = null

  a = aNodes.pop()
  b = bNodes.pop()
  while (a === b) {
    c = a
    a = aNodes.pop()
    b = bNodes.pop()
  }
  return c
}
