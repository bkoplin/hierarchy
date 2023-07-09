import {
  filterObject, length, pipe, prop, uniq, zipObj,
} from 'rambdax'
import type {
  IterableElement, StringKeyOf,
} from 'type-fest'
import type {
  ChromaStatic, Color,
} from 'chroma-js'
import chroma from 'chroma-js'
import type { I, } from 'ts-toolbelt'
import type {
  BaseNode, KeyFn,
} from './types'
import type { NodeType, } from './NodeType'
import { iterator, } from './iterator'

export abstract class Node<
  Datum,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>> = []
> implements BaseNode<Datum, KeyFuncs, I.IterationOf<0>> {
  constructor(
    public keyFns: KeyFuncs,
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

  [Symbol.iterator] = iterator
  children = [] as unknown as BaseNode<Datum, KeyFuncs>['children']
  color?: string
  colorScale: StringKeyOf<ChromaStatic['brewer']> | Array<string | Color> =
    'Spectral'

  colorScaleBy:
  | 'parentListIds'
  | 'allNodesAtDimIds'
  | 'parentListValues'
  | 'allNodesAtDimValues' = 'allNodesAtDimIds'

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

  addChild<T extends BaseNode<Datum, KeyFuncs>>(this: T, child: IterableElement<T['children']>) {
    if (this.hasChildren())
      this.children.push(child)
  }

  ancestorAt(depthOrDim) {
    return this.ancestors().find((node) => {
      if (typeof depthOrDim.depth === 'number')
        return node.depth === depthOrDim.depth
      else return node.dim === depthOrDim.dim
    })
  }

  descendantsAt(depthOrDim) {
    return this.descendants().filter((node) => {
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

  find(callback, that) {
    let index = -1

    for (const node of this) {
      if (callback.call(
        that,
        node,
        ++index,
        this
      ))
        return node
    }
  }

  hasChildren(this: BaseNode<Datum, KeyFuncs>): ReturnType<BaseNode<Datum, KeyFuncs>['hasChildren']> {
    return this?.height > 0
  }

  hasParent(this: BaseNode<Datum, KeyFuncs>) {
    return this?.depth > 0
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
    this: NodeType<Datum, readonly [keyof Datum]>,
    ...args: Parameters<BaseNode<Datum, this['depth']>['setColor']>
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
      if (
        (node.colorScaleBy === 'allNodesAtDimIds' ||
          node.colorScaleBy === 'parentListIds') &&
        node.hasParent()
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
          .domain(colorValues)(node.id)
          .hex()
      }
    })
    return this
  }

  setValueFunction(this: NodeType<Datum, readonly [keyof Datum]>, valueFn) {
    this.each(node => (node.valueFunction = valueFn))
    this.setValues()
  }

  setValues(this: NodeType<Datum, readonly [keyof Datum]>) {
    this.each(node => (node.value = node.valueFunction(node)))
  }

  toJSON(this: NodeType<Datum, readonly [keyof Datum]>) {
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
export class LeafNode<
  Datum,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>>
> extends Node<Datum, KeyFuncs> {
  constructor(
    keyFuncs: KeyFuncs,
    depth: number,
    records: Datum[],
    id: any,
    dim: any
  ) {
    super(
      keyFuncs,
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
export class RootNode<
  Datum,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>>
> extends Node<Datum, KeyFuncs> {
  constructor(keyFuncs: KeyFuncs, height: number, records: Datum[]) {
    super(
      keyFuncs,
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

  type = 'root' as const
}
export function createRootNode<
  Datum,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>>
>(keyFuncs: KeyFuncs, records: Datum[]) {
  return new RootNode(
    keyFuncs,
    keyFuncs.length,
    records
  ) as unknown as BaseNode<Datum, KeyFuncs>
}
export class HierarchyNode<
  Datum,
  KeyFuncs extends ReadonlyArray<KeyFn<Datum>>
> extends Node<Datum, KeyFuncs> {
  constructor(
    keyFuncs: KeyFuncs,
    depth: number,
    height: number,
    records: Datum[],
    id: any,
    dim: any
  ) {
    super(
      keyFuncs,
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
