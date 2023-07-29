import { objectEntries, } from '@antfu/utils'
import {
  groupBy, propOr, 
} from 'rambdax'

import type { JsonObject, } from 'type-fest'

import type {
  N, L, 
} from 'ts-toolbelt'
import type {
  KeyFn, KeyFnTuple, 
} from './types'
import {Node,} from './Nodes'

export function group<
  Input extends JsonObject | string,
  KeyFunctions extends ReadonlyArray<KeyFn<Input>>
>(values: Input[], ...keys: KeyFunctions): Node<Input, KeyFunctions, 0> {
  const rootDepth = 0 as const
  const rootHeight = keys.length as N.Sub<
    L.Length<KeyFunctions>,
    typeof rootDepth
  >
  const root = new Node(
    keys,
    values,
    rootDepth,
    rootHeight,
    undefined
  )

  for (let child of root) {
    child = regroupFn(child)
  }

  return root

  function regroupFn<
    GroupNode extends Node<Input, KeyFunctions>
  >(node: GroupNode) {
    const {
      keyFns, depth, height, 
    } = node
    const childDepth = (depth + 1) as N.Add<GroupNode['depth'], 1>
    const childHeight = (height - 1) as N.Sub<GroupNode['height'], 1>
    const keyFn = keyFns[depth] as KeyFn<Input>

    objectEntries(groupBy(
      (x) => {
        if (
          typeof keyFn === 'string' ||
          typeof keyFn === 'number' ||
          typeof keyFn === 'symbol'
        ) {
          return propOr(
            '',
            keyFn,
            x
          )
        } else if (typeof keyFn?.[1] === 'function') {
          return (keyFn as KeyFnTuple<Input>)[1](x)
        } else return undefined
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
          `${key}`
        )

        node.addChild(child)
      }
    })

    return node
  }
}
