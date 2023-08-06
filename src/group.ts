import { objectEntries, } from '@antfu/utils'
import { groupBy, } from 'rambdax'

import type {
  FixedLengthArray, JsonObject,
} from 'type-fest'

import type {
  L, N,
} from 'ts-toolbelt'
import type { KeyFn, KeyFnKey, } from './types'
import { Node, } from './Nodes'

export function group<
  Input extends JsonObject | string,
  KeyFunctions extends ReadonlyArray<KeyFn<Input>>
>(values: Input[], ...keys: KeyFunctions) {
  const root = new Node(
    keys,
    values,
    0 as const
  )

  // @ts-ignore
  for (const nodeIter of root) regroupFn(nodeIter)

  return root

  function regroupFn(node: N.Sub<KeyFunctions['length'], 0> extends 0
    ? Node<Input, KeyFunctions, 0, N.Sub<KeyFunctions['length'], 0>>
    : never) {
    const keyFns = node.keyFns
    const depth = node.depth
    const childDepth = depth + 1
    const keyFn = keyFns[depth]

    objectEntries(groupBy(
      // @ts-ignore
      rec => rec[keyFn],
      node.records
    )).forEach((vals) => {
      const [
        _key,
        records,
      ] = vals

      if (childDepth <= keyFns.length) {
        const child = new Node(
          keyFns,
          records,
          childDepth,
          node.height - 1,
          _key
        )

        node.addChild(child as Parameters<typeof node.addChild>[0])
      }
    })
  }
}
