import type {
  FixedLengthArray, ValueOf,
} from 'type-fest'
import type {
  L, N,
} from 'ts-toolbelt'

import {
  identity,
  uniq as unique,
} from 'lodash-es'
import { flatten, } from './flatten'
import type {
  KeyFn, NestedArray, NestedMap, NestedRollups,
} from './types'

export function group<T, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6>>(values: T[], ...keys: KeyFns) {
  return nest<T, KeyFns>(
    values,
    identity,
    identity,
    keys
  )
}
export function rollup<T, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6> = FixedLengthArray<KeyFn<T>, 2>>(values: T[], reduce: (acc: T[]) => number, ...keys: KeyFns) {
  return nest(
    values,
    identity,
    reduce,
    keys
  )
}
export function rollups<T, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6> = FixedLengthArray<KeyFn<T>, 2>>(values: T[], reduce: (acc: T[]) => number, ...keys: KeyFns) {
  return nest(
    values,
    Array.from,
    reduce,
    keys
  ) as unknown as NestedRollups<T, N.Sub<L.Length<KeyFns>, 1>>
}
export { group as default, }
export function groups<T, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6> = FixedLengthArray<KeyFn<T>, 2>>(values: T[], ...keys: KeyFns) {
  return nest(
    values,
    Array.from,
    identity,
    keys
  ) as unknown as NestedArray<T, N.Sub<L.Length<KeyFns>, 1>>
}
export function flatGroup<T, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6> = FixedLengthArray<KeyFn<T>, 2>>(values: T[], ...keys: KeyFns) {
  return flatten(
    groups<T, KeyFns>(
      values,
      ...keys
    ),
    keys
  )
}
export function index<T, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6> = FixedLengthArray<KeyFn<T>, 2>>(values: T[], ...keys: KeyFns) {
  return nest<L.Length<KeyFns>, T, KeyFns>(
    values,
    identity,
    unique,
    keys
  )
}
export function indexes<T, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6> = FixedLengthArray<KeyFn<T>, 2>>(values: T[], ...keys: KeyFns) {
  return nest<L.Length<KeyFns>, T, KeyFns>(
    values,
    Array.from,
    unique,
    keys
  )
}
export function nest<T, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6>>(values: T[], mapFn: typeof identity, reduceFn: typeof identity, keyFns: KeyFns): NestedMap<T, L.Length<KeyFns>>
export function nest<Levels extends number, T, KeyFns extends FixedLengthArray<KeyFn<T>, Levels>>(values: T[], mapFn: ArrayConstructor['from'], reduceFn: typeof identity, keyFns: KeyFns): NestedArray<T, Levels>
export function nest<Levels extends number, T, KeyFns extends FixedLengthArray<KeyFn<T>, Levels>>(values: T[], mapFn: {
  <R>(map: Map<ValueOf<R>, R[]>): Array<[ValueOf<R>, R[]]>
} | typeof identity, reduceFn: typeof identity | {
  (acc: T[]): number
}, keyFns: KeyFns) {
  return (function regroup(groupValues: T[], i) {
    if (i >= keyFns.length)
      return reduceFn(groupValues)
    const firstValue = groupValues.shift() as T
    const keyof = keyFns[i++]
    const firstKey = keyof(
      firstValue,
      0,
      groupValues
    )
    const subGroups = new Map([ [
      firstKey,
      [ firstValue, ],
    ], ])

    groupValues.forEach((value, subIndex) => {
      const key = keyof(
        value,
        ++subIndex,
        groupValues
      )
      const subGroup = subGroups.get(key)

      if (subGroup) { subGroup.push(value) }
      else {
        subGroups.set(
          key,
          [ value, ]
        )
      }
    })
    for (const [
      key,
      mapValues,
    ] of subGroups) {
      subGroups.set(
        key,
        regroup(
          mapValues,
          i
        ) as T[]
      )
    }

    return mapFn(subGroups)
  })(
    values,
    0
  )
}
