import { objectEntries } from '@antfu/utils'
import { groupBy } from 'rambdax'

import type { FixedLengthArray, JsonObject } from 'type-fest'

import type { L, N } from 'ts-toolbelt'
import type { KeyFn } from './types'
import { Node, RootNode, LeafNode } from './Nodes'

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
  KeyFunctions extends ReadonlyArray<KeyFn<Input>>
>(values: Input[], ...keys: KeyFunctions): RootNode<Input, KeyFunctions> {
  const root = new RootNode(keys, values)

type TupleKeyFn<Datum extends string | JsonObject> = readonly [
  string,
  (datum: Datum, idx?: number, vals?: Datum[]) => string
]
type KeyKeyFn<Datum extends string | JsonObject> = Datum extends string
  ? KeyOfString<Datum>
  : StringKeyOf<Datum>

type KeyOfString<T extends string> = keyof L.ObjectOf<S.Split<T, ''>>

  root
    .eachBefore((node) => {
      if (typeof node.children !== 'undefined') {
        node.children.forEach((child) => {
          if (child.parent) child.parent = node
        })
      }
    })
    .setColor()

  return root

  function regroupFn(
    node:
      | RootNode<Input, KeyFunctions, 0, KeyFunctions['length']>
      | Node<
          Input,
          KeyFunctions,
          L.KeySet<1, N.Sub<KeyFunctions['length'], 1>>,
          L.KeySet<1, N.Sub<KeyFunctions['length'], 1>>
        >
  ) {
    const { keyFns: nodeKeyFns, depth, height } = node
    const [, ...keyFns] = nodeKeyFns
    type DepthOrHeight = L.KeySet<1, N.Sub<KeyFunctions['length'], 1>>
    const childDepth = depth + 1
    const childHeight = height - 1
    objectEntries(
      groupBy((x) => {
        const key = node.keyFn(x)
        if (typeof key === 'undefined') return ''
        return key
      }, node.records)
    ).forEach((vals) => {
      const [key, records] = vals
      if (childHeight > 1) {
        const child = new Node(
          keyFns,
          records,
          childDepth,
          childHeight,
          `${key}`
        )
        node.addChild(child)
      } else if (childHeight === 0) {
        const child = new LeafNode(keyFns, records, keyFns.length, `${key}`)
        node.addChild(child)
      }
    })
  })
}
