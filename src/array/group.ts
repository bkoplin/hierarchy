import { objectEntries } from '@antfu/utils'
import { groupBy, propOr } from 'rambdax'

import type { FixedLengthArray, JsonObject } from 'type-fest'

import type { L, N } from 'ts-toolbelt'
import type { KeyFn, KeyFnTuple } from './types'
import { Node, RootNode, LeafNode } from './Nodes'

export function group<
  Input extends JsonObject | string,
  KeyFunctions extends ReadonlyArray<KeyFn<Input>>
>(values: Input[], ...keys: KeyFunctions): RootNode<Input, KeyFunctions> {
  const root = new RootNode(keys, values, 0, keys.length)

  regroupFn(root)
  let children

  while ((children = root?.children) !== undefined)
    for (const child of children) regroupFn(child)

  // root
  //   .eachBefore((node) => {
  //     if (typeof node.children !== 'undefined') {
  //       node.children.forEach((child) => {
  //         if (child.parent) child.parent = node
  //       })
  //     }
  //   })
  //   .setColor()

  return root

  function regroupFn<
    GroupNode extends {
      depth: number
      height: number
      records: Input[]
      keyFns: KeyFunctions
    }
  >(node: GroupNode) {
    const { keyFns, depth, height } = node
    const childDepth = (depth + 1) as N.Add<GroupNode['depth'], 1>
    const childHeight = (height - 1) as N.Sub<GroupNode['height'], 1>
    const keyFn = keyFns[depth] as KeyFn<Input>
    objectEntries(
      groupBy((x: JsonObject | string) => {
        if (
          typeof keyFn === 'string' ||
          typeof keyFn === 'number' ||
          typeof keyFn === 'symbol'
        ) {
          if (typeof x === 'string') return x[keyFn as unknown as number]
          else return propOr('', keyFn, x)
        } else {
          return (keyFn as KeyFnTuple<Input>)[1](x)
        }
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
