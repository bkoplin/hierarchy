import { objectEntries } from '@antfu/utils'
import { groupBy, propOr } from 'rambdax'

import type { JsonObject } from 'type-fest'

import type { N } from 'ts-toolbelt'
import type { KeyFn, KeyFnTuple } from './types'
import { Node, RootNode, LeafNode } from './Nodes'

export function group<
  Input extends JsonObject | string,
  KeyFunctions extends ReadonlyArray<KeyFn<Input>>
>(values: Input[], ...keys: KeyFunctions): RootNode<Input, KeyFunctions> {
  const root = new RootNode(keys, values)

  for (let child of root) {
    child = regroupFn(child)
  }

  // root.eachBefore((node) => {
  //   if (node.children)
  //     node.children.forEach((child) => {
  //       child.parent = node
  //     })
  // })

  return root

  function regroupFn<
    GroupNode extends Node<Input, KeyFunctions> | RootNode<Input, KeyFunctions>
  >(node: GroupNode) {
    const { keyFns, depth, height } = node
    const childDepth = (depth + 1) as N.Add<GroupNode['depth'], 1>
    const childHeight = (height - 1) as N.Sub<GroupNode['height'], 1>
    const keyFn = keyFns[depth] as KeyFn<Input>

    objectEntries(
      groupBy((x) => {
        if (
          typeof keyFn === 'string' ||
          typeof keyFn === 'number' ||
          typeof keyFn === 'symbol'
        ) {
          return propOr('', keyFn, x)
        } else if (typeof keyFn?.[1] === 'function') {
          return (keyFn as KeyFnTuple<Input>)[1](x)
        } else return undefined
      }, node.records)
    ).forEach((vals) => {
      const [key, records] = vals

      if (childHeight >= 1) {
        const child = new Node(
          keyFns,
          records,
          childDepth,
          childHeight,
          `${key}`
        )

        node.addChild(child)
      } else {
        const child = new LeafNode(keyFns, records, `${key}`)

        node.addChild(child)
      }
    })

    return node
  }
}
