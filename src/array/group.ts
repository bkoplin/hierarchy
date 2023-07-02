import { objectEntries, } from '@antfu/utils'
import { groupBy, } from 'rambdax'

import type {
  JsonPrimitive, ValueOf,
} from 'type-fest'
import type { L, } from 'ts-toolbelt'
import type {
  KeyFn, KeyFns, NodeType,
} from './types'
import {
  HierarchyNode, LeafNode, RootNode,
} from './Nodes'

export default group
export function group<
  Input extends { [index: string | number]: JsonPrimitive }
>(values: Input[], key1: KeyFn<Input>): NodeType<Input, 1>
export function group<
  Input extends { [index: string | number]: JsonPrimitive }
>(values: Input[], key1: KeyFn<Input>, key2: KeyFn<Input>): NodeType<Input, 2>
export function group<
  Input extends { [index: string | number]: JsonPrimitive }
>(
  values: Input[],
  key1: KeyFn<Input>,
  key2: KeyFn<Input>,
  key3: KeyFn<Input>,
): NodeType<Input, 3>
export function group<
  Input extends { [index: string | number]: JsonPrimitive }
>(
  values: Input[],
  key1: KeyFn<Input>,
  key2: KeyFn<Input>,
  key3: KeyFn<Input>,
  key4: KeyFn<Input>,
): NodeType<Input, 4>
export function group<
  Input extends { [index: string | number]: JsonPrimitive }
>(
  values: Input[],
  key1: KeyFn<Input>,
  key2: KeyFn<Input>,
  key3: KeyFn<Input>,
  key4: KeyFn<Input>,
  key5: KeyFn<Input>,
): NodeType<Input, 5>
export function group<
  Input extends { [index: string | number]: JsonPrimitive }
>(
  values: Input[],
  key1: KeyFn<Input>,
  key2: KeyFn<Input>,
  key3: KeyFn<Input>,
  key4: KeyFn<Input>,
  key5: KeyFn<Input>,
  key6: KeyFn<Input>,
): NodeType<Input, 6>
export function group<
  Input extends { [index: string | number]: JsonPrimitive },
  KeyFunctions extends KeyFns<Input>
>(values: Input[], ...keys: KeyFunctions): NodeType<Input, L.Length<KeyFunctions>> {
  const root = new RootNode(
    keys.length,
    values
  )
  let idx = 0
  const thisNode = regroupFn(
    root,
    keys[idx]
  )
  let children

  while ((children = thisNode?.children) !== undefined && !!keys[idx + 1]) {
    idx++
    for (const child of children) {
      regroupFn(
        child,
        keys[idx]
      )
    }
  }
  return root.eachBefore((node) => {
    if (node.hasChildren()) {
      node.children.forEach((child) => {
        child.parent = node
      })
    }
  })
  function regroupFn(
    node: any,
    keyof: any
  ) {
    const depth = node.depth + 1
    const height = node.height - 1
    let keyFn: (d: Input) => ValueOf<Input>

    if (typeof keyof === 'string' || typeof keyof === 'number')
      keyFn = (d: Input) => d[keyof]
    else keyFn = keyof[1]
    const dim = typeof keyof === 'string' ? keyof : keyof[0]
    const groupsObject = objectEntries(groupBy(
      (x) => {
        const val = keyFn(x)

        if (val === null || typeof val === 'undefined')
          return ''
        else return val
      },
      node.records
    ))

    groupsObject.forEach((vals) => {
      const [
        key,
        records,
      ] = vals

      if (node.height > 1) {
        const child = new HierarchyNode(
          depth,
          height,
          records,
          key as ValueOf<Input>,
          dim
        )

        node.addChild(child)
      }
      else {
        const child = new LeafNode(
          depth,
          records,
          key as ValueOf<Input>,
          dim
        )

        node.addChild(child)
      }
    })

    return node
  }
}
