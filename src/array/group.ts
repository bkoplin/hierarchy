import type { JsonObject, ReadOnlyTuple, } from 'type-fest'
import type {
  type L, type N,
} from 'ts-toolbelt'

import {
  identity,
  uniq,
} from 'lodash-es'
import type {
  GroupArguments,
  KeyFn, NestedArray, NestedMap, NestedRollups,
} from '../types'
import { flatten, } from './flatten'
import { InternMap, } from './internmap'

function unique<T>(values: T[]) {
  return uniq(values)[0]
}

export function group<T extends JsonObject, Args extends GroupArguments<T>>(...args: Args): NestedMap<T, N.Sub<L.Length<Args>, 1>> {
  const [
    values,
    ...keys
  ] = args

  // export function group<T>(values: T[], ...keys: [KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>]): NestedMap<T, 5>
  // export function group<T>(values: T[], ...keys: [KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>]): NestedMap<T, 4>
  // export function group<T>(values: T[], ...keys: [KeyFn<T>, KeyFn<T>, KeyFn<T>]): NestedMap<T, 3>
  // export function group<T>(values: T[], ...keys: [KeyFn<T>, KeyFn<T>]): NestedMap<T, 2>
  // export function group<T>(values: T[], ...keys: [KeyFn<T>]): NestedMap<T, 1> {
  return nest(
    values,
    identity,
    identity,
    keys
  )
}
export function rollup<T>(values: T[], reduce: <R = number>(acc: T[]) => R, ...keys: ReadOnlyTuple<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6>) {
  return nest<T, typeof keys>(
    values,
    identity,
    reduce,
    keys
  )
}
export function rollups<T, KeyFns extends ReadOnlyTuple<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6> = ReadOnlyTuple<KeyFn<T>, 2>>(values: T[], reduce: <R = number>(acc: T[]) => R, ...keys: KeyFns) {
  return nest(
    values,
    Array.from,
    reduce,
    keys
  ) as unknown as NestedRollups<T, N.Sub<L.Length<KeyFns>, 1>>
}
export { group as default, }
export function groups<T, KeyFns extends ReadOnlyTuple<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6> = ReadOnlyTuple<KeyFn<T>, 2>>(values: T[], ...keys: KeyFns) {
  return nest(
    values,
    Array.from,
    identity,
    keys
  ) as unknown as NestedArray<T, N.Sub<L.Length<KeyFns>, 1>>
}
export function flatGroup<T, KeyFns extends ReadOnlyTuple<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6> = ReadOnlyTuple<KeyFn<T>, 2>>(values: T[], ...keys: KeyFns) {
  return flatten(
    groups<T, KeyFns>(
      values,
      ...keys
    ),
    keys
  )
}
export function index<T, KeyFns extends ReadOnlyTuple<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6> = ReadOnlyTuple<KeyFn<T>, 2>>(values: T[], ...keys: KeyFns) {
  return nest<L.Length<KeyFns>, T, KeyFns>(
    values,
    identity,
    unique,
    keys
  )
}
export function indexes<T, KeyFns extends ReadOnlyTuple<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6> = ReadOnlyTuple<KeyFn<T>, 2>>(values: T[], ...keys: KeyFns) {
  return nest<L.Length<KeyFns>, T, KeyFns>(
    values,
    Array.from,
    unique,
    keys
  )
}

function nest(values, map, reduce, keys) {
  return (function regroup(values, i) {
    if (i >= keys.length)
      return reduce(values)
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const groups = new InternMap()
    const keyof = keys[i++]
    // eslint-disable-next-line @typescript-eslint/no-shadow
    let index = -1
    // eslint-disable-next-line padding-line-between-statements
    for (const value of values) {
      const key = keyof(
        value,
        ++index,
        values
      )
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const group = groups.get(key)
      // eslint-disable-next-line padding-line-between-statements
      if (group) { group.push(value) }
      else {
        groups.set(
          key,
          [ value, ]
        )
      }
    }

    for (const [
      key,
      values,
    ] of groups) {
      groups.set(
        key,
        regroup(
          values,
          i
        )
      )
    }
    return map(groups)
  // eslint-disable-next-line function-call-argument-newline
  })(values, 0)
}
