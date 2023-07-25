import { objectEntries } from '@antfu/utils'
import { groupBy } from 'rambdax'

import type { FixedLengthArray, JsonObject } from 'type-fest'

import type { L, N } from 'ts-toolbelt'
import type { KeyFn } from './types'
import { Node, RootNode, LeafNode } from './Nodes'

export function group<
  Input extends JsonObject | string,
  KeyFunctions extends ReadonlyArray<KeyFn<Input>>
>(values: Input[], ...keys: KeyFunctions): RootNode<Input, KeyFunctions> {
  const root = new RootNode(keys, values)

  regroupFn(root)
  let children

  while ((children = root?.children) !== undefined)
    for (const child of children) regroupFn(child)

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

    return node
  }
}
