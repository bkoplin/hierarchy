import {
  A, I, L, N, S, 
} from 'ts-toolbelt'
import type {
  Get,
  IsNever, JsonObject, StringKeyOf,
} from 'type-fest'

export type KeyFnTuple<T> = readonly [
  string,
  (datum: T, idx?: number, vals?: T[]) => string | number | undefined
]
export type KeyFnKey<T> = T extends JsonObject
  ? StringKeyOf<T>
  : T extends string
  ? StringKeyOf<L.ObjectOf<S.Split<T, ''>>>
  : undefined
export type KeyFn<T = any> = KeyFnTuple<T> | KeyFnKey<T>
export type IndexOfElement<
  Arr,
  Elem,
  Iter extends I.Iteration = I.IterationOf<0>
> = Arr extends L.List
  ? {
      1: {
        0: IndexOfElement<Arr, Elem, I.Next<Iter>>
        1: I.Pos<Iter>
      }[A.Equals<Elem, A.At<Arr, I.Key<Iter>>>]
      0: L.KeySet<0, N.Sub<L.Length<Arr>, 1>>
    }[N.Lower<I.Pos<Iter>, L.Length<Arr>>]
  : never

