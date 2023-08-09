import { objectEntries, } from '@antfu/utils'
import {
  groupBy, prop,
} from 'rambdax'

import type { JsonObject, } from 'type-fest'

import type { N, } from 'ts-toolbelt'
import type { KeyFn, } from './types'
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
    const keyFn = Array.isArray(keyFns[depth]) ? keyFns[depth][1] : prop(keyFns[depth])

    objectEntries(groupBy(
      // @ts-ignore
      rec => keyFn(rec),
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
          _key
        )

        node.addChild(child as Parameters<typeof node.addChild>[0])
      }
    })
  }
}
