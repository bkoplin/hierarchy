import { objectEntries, } from '@antfu/utils'
import { groupBy, } from 'rambdax'

import type { JsonObject, } from 'type-fest'

import type {
  I, L, N,
} from 'ts-toolbelt'
import { isArray, } from 'lodash-es'
import type { KeyFn, } from './types'
import {
  HierarchyNode,
  LeafNode, Node,
} from './Nodes'

export function group<
  Input extends JsonObject | String,
  KeyFunctions extends L.List<KeyFn<Input>>
>(values: Input[], ...keys: KeyFunctions): Node<Input, KeyFunctions> {
  const root = new Node(
    keys,
    0,
    values,
    undefined
  )
  const thisNode = regroupFn(root)
  let children

  while ((children = thisNode?.children) !== undefined) {
    for (const child of children)
      regroupFn(child)
  }

  root
    .eachBefore((node) => {
      if (node.hasChildren()) {
        node.children!.forEach((child) => {
          if (child.hasParent())
            child.parent = node
        })
      }
    })
    .setColor()

  return root

  function regroupFn<NodeType extends Node<Input, KeyFunctions, I.IterationOf<N.Range<0, L.Drop<KeyFunctions, 1>['length']>[number]>>>(node: NodeType) {
    const depth: N.Add<NodeType['depth'], 1> = node.depth + 1 as unknown as N.Add<NodeType['depth'], 1>
    const height: N.Sub<NodeType['height'], 1> = node.height - 1 as unknown as N.Sub<NodeType['height'], 1>
    const keyof = node.keyFns[node.depth]
    const groupsObject = objectEntries(groupBy(
      (x) => {
        if (isArray(keyof))
          return keyof[1](x) ?? ''
        else if (!isArray(keyof))
          return x[keyof] ?? ''
        else return ''
      },
      node.records
    ))

    groupsObject.forEach((vals) => {
      const [
        key,
        records,
      ] = vals

      if (height > 0) {
        const child = new HierarchyNode(
          node.keyFns,
          depth,
          records,
          key
        )

        node.addChild(child)
      }
      else {
        const child = new LeafNode(
          node.keyFns,
          records,
          key
        )

        node.addChild(child)
      }
    })

    return node
  }
}
