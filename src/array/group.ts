import { objectEntries, } from '@antfu/utils'
import { groupBy, } from 'rambdax'

import type {
  FixedLengthArray, JsonObject,
} from 'type-fest'

import type { L, } from 'ts-toolbelt'
import type { KeyFn, } from './types'
import { Node, } from './Nodes'

export function group<
  Input extends JsonObject | string,
  KeyFunctions extends ReadonlyArray<KeyFn<Input>>
>(
  values: Input[],
  ...keys: KeyFunctions
): Node<Input, KeyFunctions, 0> {
  const root = new Node(
    keys,
    values,
    0 as const
  )

  regroupFn(root)
  let children

  while ((children = root?.children) !== undefined)
    for (const child of children) regroupFn(child)

  root
    .eachBefore((node) => {
      if (typeof node.children !== 'undefined') {
        node.children.forEach((child) => {
          if (child.parent)
            child.parent = node
        })
      }
    })
    .setColor()

  return root

  function regroupFn<
    NodeType extends Node<
      Input,
      KeyFunctions,
      L.KeySet<0, KeyFunctions['length']>
    >
  >(node: NodeType) {
    objectEntries(groupBy(
      (x) => node.keyFn(x),
      node.records
    )).forEach((vals) => {
      const [
        key,
        records,
      ] = vals
      const child = new Node(
        node.keyFns,
        records,
        node.depth + 1,
        node.height - 1,
        key
      )

      node.addChild(child)
    })

    return node
  }
}
