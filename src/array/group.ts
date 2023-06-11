import type {
  FixedLengthArray,
  JsonObject, JsonPrimitive, LiteralUnion, ValueOf,
} from 'type-fest'
import type {
  I, L, N,
} from 'ts-toolbelt'

import {
  identity, uniq,
} from 'lodash-es'
import { flatten, } from './flatten'

export function group<T extends JsonObject, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6>>(values: T[], ...keys: KeyFns) {
  return nest(
    values,
    identity,
    identity,
    keys
  ) as unknown as NestedMap<T, N.Sub<L.Length<KeyFns>, 1>>
}
export function rollup<T extends JsonObject, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6>>(values: T[], reduce: (acc: T[]) => number, ...keys: KeyFns) {
  return nest(
    values,
    identity,
    reduce,
    keys
  ) as unknown as NestedRollup<T, N.Sub<L.Length<KeyFns>, 1>>
}
export function rollups<T extends JsonObject, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6>>(values: T[], reduce: (acc: T[]) => number, ...keys: KeyFns) {
  return nest(
    values,
    Array.from,
    reduce,
    keys
  ) as unknown as NestedRollups<T, N.Sub<L.Length<KeyFns>, 1>>
}
export { group as default, }
export function groups<T extends JsonObject, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6>>(values: T[], ...keys: KeyFns) {
  return nest(
    values,
    Array.from,
    identity,
    keys
  ) as unknown as NestedArray<T, N.Sub<L.Length<KeyFns>, 1>>
}
export function flatGroup<T extends JsonObject, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6>>(values: T[], ...keys: KeyFns) {
  return flatten(
    groups<T, KeyFns>(
      values,
      ...keys
    ),
    keys
  )
}
export function index<T extends JsonObject, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6>>(values: T[], ...keys: KeyFns) {
  return nest<L.Length<KeyFns>, T, KeyFns>(
    values,
    identity,
    unique,
    keys
  )
}
export function indexes<T extends JsonObject, KeyFns extends FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6>>(values: T[], ...keys: KeyFns) {
  return nest<L.Length<KeyFns>, T, KeyFns>(
    values,
    Array.from,
    unique,
    keys
  )
}

function unique(values) {
  return uniq(values)[0]
}

export type KeyFn<T> = (obj: T, idx: number, objs: T[]) => ValueOf<T>
export type NestedMap<
  T,
  Len extends LiteralUnion<0 | 1 | 2 | 3 | 4 | 5 | 6, number> = 6,
  Iter extends I.Iteration = I.IterationOf<Len>,
  M extends Map<any, any> = Map<keyof T, T[]>
> = {
  0: NestedMap<T, Len, I.Prev<Iter>, Map<keyof T, M>>
  1: Map<keyof T, M>
}[N.IsZero<I.Pos<Iter>>]
export type NestedRollup<
  T,
  Len extends LiteralUnion<0 | 1 | 2 | 3 | 4 | 5 | 6, number> = 6,
  Iter extends I.Iteration = I.IterationOf<Len>,
  M extends Map<any, any> = Map<keyof T, number>
> = {
  0: NestedMap<T, Len, I.Prev<Iter>, Map<keyof T, M>>
  1: Map<keyof T, M>
}[N.IsZero<I.Pos<Iter>>]
export type NestedArray<
  T,
  Len extends LiteralUnion<0 | 1 | 2 | 3 | 4 | 5 | 6, number> = 6,
  Iter extends I.Iteration = I.IterationOf<Len>,
  M = [keyof T, T[]]
> = {
  0: NestedArray<T, Len, I.Prev<Iter>, [keyof T, M[]]>
  1: [keyof T, M[]]
}[N.IsZero<I.Pos<Iter>>]
export type NestedRollups<
  T,
  Len extends LiteralUnion<0 | 1 | 2 | 3 | 4 | 5 | 6, number> = 6,
  Iter extends I.Iteration = I.IterationOf<Len>,
  M = [keyof T, number]
> = {
  0: NestedArray<T, Len, I.Prev<Iter>, [keyof T, M[]]>
  1: [keyof T, M[]]
}[N.IsZero<I.Pos<Iter>>]
export function nest<Levels extends number, T extends JsonObject, KeyFns extends FixedLengthArray<KeyFn<T>, Levels>>(values: T[], mapFn: {
  <R>(map: R): R
  <R>(map: Map<ValueOf<R>, R[]>): Array<[ValueOf<R>, R[]]>
}, reduceFn: {
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
