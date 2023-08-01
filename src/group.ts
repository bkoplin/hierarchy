import { objectEntries, } from '@antfu/utils'
import {
  groupBy, propOr,
} from 'rambdax'

import type {
  FixedLengthArray, JsonObject,
} from 'type-fest'

import type { L, } from 'ts-toolbelt'
import type { KeyFnKey, } from './types'
import { Node, } from './Nodes'

export function group<
  Input extends JsonObject | string,
  KeyFunctions extends FixedLengthArray<KeyFnKey<Input>, L.KeySet<1, 13>>
>(values: Input[], ...keys: KeyFunctions) {
  const root = new Node(
    keys,
    values,
    0
  )

  for (const nodeIter of root)
    regroupFn(nodeIter)

  return root

  function regroupFn(node: Node<Input, KeyFunctions, L.KeySet<0, KeyFunctions['length']>>) {
    const keyFns = node.keyFns
    const depth = node.depth
    const childDepth = (depth + 1)
    const keyFn = keyFns[depth]

    objectEntries(groupBy(
      propOr(
        '',
        keyFn
      ),
      node.records
    )).forEach((vals) => {
      const [ records, ] = vals

      if (childDepth <= keyFns.length) {
        const child = new Node(
          keyFns,
          records,
          childDepth
        )

        node.addChild(child)
      }
    })
  }
}
