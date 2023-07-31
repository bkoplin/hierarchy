import { objectEntries, } from '@antfu/utils'
import {
  groupBy, propOr,
} from 'rambdax'

import type {
  FixedLengthArray, IterableElement, JsonObject,
} from 'type-fest'

import type {
  L, N,
} from 'ts-toolbelt'
import type {
  KeyFn, KeyFnTuple,
} from './types'
import { Node, } from './Nodes'

export function group<
  Input extends JsonObject | string,
  KeyFunctions extends FixedLengthArray<KeyFn<Input>, L.KeySet<1, 13>>
>(values: Input[], ...keys: KeyFunctions) {
  const root = new Node(
    keys,
    values,
    0,
    keys.length,
    undefined
  )

  for (let child of root)
    child = regroupFn(child)

  return root

  function regroupFn(node: IterableElement<typeof root>) {
    type GroupNode = typeof node
    const {
      keyFns, depth, height,
    } = node
    const childDepth = (depth + 1) as N.Add<GroupNode['depth'], 1>
    const childHeight = (height - 1) as N.Sub<GroupNode['height'], 1>
    const keyFn = keyFns[depth] as KeyFn<Input>

    objectEntries(groupBy(
      // @ts-expect-error
      (x) => {
        if (
          typeof keyFn === 'string' ||
          typeof keyFn === 'number' ||
          typeof keyFn === 'symbol'
        ) {
          return propOr(
            '',
            keyFn,
            // @ts-expect-error
            x
          )
        }
        else if (typeof keyFn?.[1] === 'function') {
          return (keyFn as KeyFnTuple<Input>)[1](x)
        }
        else { return undefined }
      },
      node.records
    )).forEach((vals) => {
      const [
        key,
        records,
      ] = vals

      if (childHeight >= 0) {
        const child = new Node(
          keyFns,
          records,
          childDepth,
          childHeight,
          // @ts-expect-error
          `${key}`
        )

        // @ts-expect-error
        node.addChild(child)
      }
    })

    return node
  }
}
