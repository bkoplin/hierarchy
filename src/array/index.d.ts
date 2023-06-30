import type { L, U } from 'ts-toolbelt'
import type {
  JsonObject, StringKeyOf,
  ValueOf
} from 'type-fest'

export type KeyFn<T> = readonly [
  StringKeyOf<T>,
  (datum: T, idx?: number, vals?: T[]) => ValueOf<T>
] |
  StringKeyOf<T>
export type KeyFns<T> = readonly [ KeyFn<T> ] |
  readonly [ KeyFn<T>, KeyFn<T> ] |
  readonly [ KeyFn<T>, KeyFn<T>, KeyFn<T> ] |
  readonly [ KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T> ] |
  readonly [ KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T> ] |
  readonly [ KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T> ] |
  readonly [
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>
  ] |
  readonly [
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>
  ] |
  readonly [
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>
  ]
export type KeyFnsLength = L.Length<KeyFns<JsonObject>> | 0
export type MaxDepth = U.Last<KeyFnsLength>
