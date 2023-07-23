// test
import { objectEntries } from '@antfu/utils'
import test from '../../test/data/mockData'
import {
  Prop,
  pick,
  prop,
  contains,
  pipe,
  union,
  paths,
  produce,
  equals,
} from 'rambdax'
import { groupBy } from 'lodash-es'
import { Tree, TreeNode, TreeNodeOptions } from 'versatile-tree'
import type {
  FixedLengthArray,
  JsonObject,
  JsonPrimitive,
  StringKeyOf,
  ValueOf,
  Get,
} from 'type-fest'
import * as d3 from 'd3-hierarchy'

import type { L, S } from 'ts-toolbelt'
// import type { KeyFn } from './types'
// import { Node } from './Nodes'
class Node extends TreeNode {
  constructor(data?: Record<string, any>, options?: TreeNodeOptions) {
    const defaultOptions: TreeNodeOptions = {
      equals: (a, b) =>
        equals(pick(['id', 'dim'], a.data), pick(['id', 'dim'], b.data)),
    }
    super(data, { ...defaultOptions, ...options })
    this.options = options ?? defaultOptions
  }

  // private parent: Node | undefined
  // private children: Node[]

  public clone(): Node {
    return Node.fromJSON(this.toJSON(), this.options)
  }
  /**
   * Adds the provided node as a child of this node. If the provided node already has a parent, it will first be removed from its previous parent.
   *
   * You can specify an optional index at which to insert the child. If no index is provided, the child will be added to the end.
   *
   * In addition, if the provided node is an ancestor to this node, this node will be removed from its parent before adding the node as a child.
   * This prevents adding an ancestor as a child to create a loop, also known as a circular reference.
   * You disable this protection by setting `allowCircularReferences` to true.
   *
   * @param node The node to add as a child.
   * @param index Optional. The index at which to insert the child. If `undefined`, the child will be added to the end.
   * @param allowCircularReferences Optional. Set to `true` to allow circular references.
   */
  public addChildNode(
    this: this,
    node: Node,
    index?: number,
    allowCircularReferences?: boolean
  ) {
    if (!allowCircularReferences) {
      if (node.isAncestorOf(this)) {
        this.removeParent()
      }
    }
    node.removeParent()
    node.parent = this
    // this.removeChild(node)
    if (typeof index === 'number') {
      this.children.splice(
        Math.min(this.children.length, Math.max(0, index)),
        0,
        node
      )
    } else {
      this.children.push(node)
    }
  }

  /**
   * Creates a TreeNode with the data provided and adds it as a child. Returns the newly created TreeNode.
   *
   * @param data The child data. A new node will be created from this data.
   * @param index The index at which to add the child. Pass `undefined` to add to the end of the children.
   *
   * @returns The newly created TreeNode.
   */
  public addChildData(data: Record<string, any> = {}, index?: number): Node {
    const treeNode = new Node(data, this.options)
    this.addChildNode(treeNode, index)
    return treeNode
  }

  findFirstByVals(vals: object): Node {
    return this.getRoot().findFirst(pipe(prop('data'), contains(vals)))
  }
  findAllByVals(vals: object): Node[] {
    return this.getRoot().findAll(pipe(prop('data'), contains(vals)))
  }
  getNodePathToNode(otherNode: Node) {
    const thisPath = this.getNodePath().reverse()
    const otherPath = otherNode.getNodePath()
    return union(thisPath, otherPath)
  }
  getSelectionPathToNode(otherNode: Node) {
    const thisPath = this.getSelectionPath().reverse()
    const otherPath = otherNode.getSelectionPath()
    return union(thisPath, otherPath)
  }
  getLinks() {
    return this.getNodePath().map((node) => ({
      source: node.getParent()?.getData(),
      target: node?.getData(),
    }))
  }
  public getRoot(): Node {
    let root: Node = this
    let currNode: Node | undefined = root
    while (typeof currNode !== 'undefined') {
      currNode = currNode.getParent()
      if (currNode) {
        root = currNode
      }
    }
    return root
  }
  // eachBefore(fn: (node: Node['getData']) => void) {
  //   let nodes = this.getNodePath()

  //   nodes.forEach((node) => fn(node.getData()))
  //   return this
  // }
  // eachAfter(fn: (node: Node['getData']) => void) {
  //   let nodes = this.getChildren().reduce(function loadChildren(acc, child) {
  //     if (child.hasChildren()) child.getChildren().forEach(subC => loadChildren(acc, subC))
  //     else acc.push(child)
  //     return acc
  //   }, [this])

  //   nodes.forEach((node) => fn(node.getData()))
  //   return this
  // }
  pack() {
    const root = this.getRoot()
    const h = d3.hierarchy(this.toObject()).sum((d) => d.value)
    const p = d3.pack()(h)
    return p.descendants().map(d => {
      const node = root.findFirstByVals({ id: d.data.id , dim: d.data.dim})
      return ({ ...node.getData(), ...pick('x,y,r', d) })
    })
  }
}
export function group<
  Input extends JsonObject | string,
  KeyFunctions extends ReadonlyArrayArray<TupleKeyFn<Input> | KeyKeyFn<Input>>
>(
  values: Input[],
  keys: KeyFunctions,
  depth: L.KeySet<0, KeyFunctions['length']> = 0,
  tree?: Node
) {
  if (!tree)
    tree = new Node({
      id: 'root',
      name: 'root',
      dim: 'root',
      depth,
      height: keys['length'] - depth,
      records: values,
      value: values.length,
    })
  const fn = toKeyFn(keys[depth])
  const dim = toDim(keys[depth])
  const grouped = groupBy(values, fn)
  const trees = objectEntries(grouped).forEach(([id, records]) => {
    const child = new Node({
      id,
      name: id,
      dim,
      records,
      depth: depth + 1,
      height: keys['length'] - depth - 1,
      value: records.length,
    })
    tree!.addChildNode(child)
  })
  if (depth < keys['length'] - 1) {
    const children = tree!.getChildren()
    children.forEach((child) => {
      const d = child.getData()
      group(d.records, keys, d.depth, child)
    })
  }
  // }
  return tree
}

type TupleKeyFn<Datum extends string | JsonObject> = readonly [
  string,
  (datum: Datum, idx?: number, vals?: Datum[]) => string
]
type KeyKeyFn<Datum extends string | JsonObject> = Datum extends string
  ? KeyOfString<Datum>
  : StringKeyOf<Datum>

type KeyOfString<T extends string> = keyof L.ObjectOf<S.Split<T, ''>>

// function toKeyFn<
//   Datum extends string | JsonObject,
//   KeyFn extends TupleKeyFn<Datum>
// >(keyFn: KeyFn): KeyFn[1]
// function toKeyFn<
//   Datum extends string | JsonObject,
//   KeyFn extends KeyKeyFn<Datum>
// >(keyFn: KeyFn): Prop<Datum, KeyFn>
function toKeyFn<Datum extends string | JsonObject>(
  keyFn: TupleKeyFn<Datum> | KeyKeyFn<Datum>
) {
  if (typeof keyFn === 'string') return prop(keyFn)
  return keyFn[1]
}
function toDim<Datum extends string | JsonObject>(
  keyFn: TupleKeyFn<Datum> | KeyKeyFn<Datum>
) {
  if (typeof keyFn === 'string') return keyFn
  return keyFn[0]
}

if (import.meta.vitest) {
  const { describe, expect } = import.meta.vitest
  describe('test group function', () => {
    test('initial group', ({ data }) => {
      const treeByState = group(data, [
        ['state_letter', (o) => o.state[0]],
        'state',
      ])
      expect(treeByState.toObject()).toMatchFileSnapshot('./group.json')
      const treeM = treeByState.findFirstByVals({ id: 'M' })
      const treeA = treeByState.findFirstByVals({ id: 'Arkansas' })
      expect(treeM?.toObject()).toMatchFileSnapshot('./group_m.json')
      expect(
        treeM
          .getNodePathToNode(treeA)
          .map(pipe(prop('data'), paths(['id', 'dim'])))
      ).toMatchFileSnapshot('./group_m_a_path.json')
      expect(treeM?.getSelectionPath()).toMatchFileSnapshot(
        './group_m_selection_path.json'
      )
      expect(
        treeM?.getLinks().map(({ source, target }) => ({
          source: pick('id,dim', source),
          target: pick('id,dim', target),
        }))
      ).toMatchFileSnapshot('./group_m_links.json')
      expect(treeByState?.pack()).toMatchFileSnapshot(
        './group_m_pack.json'
      )
    })
  })
}
