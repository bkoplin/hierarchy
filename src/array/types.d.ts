import type {
  LiteralUnion, ValueOf,
} from 'type-fest'
import type {
  I, N,
} from 'ts-toolbelt'

export type KeyFn<T> = (obj: T, idx?: number, objs?: T[]) => ValueOf<T>
export type NestedMap<
  T,
  Len extends number,
  Iter extends I.Iteration = I.IterationOf<0>,
  M extends Map<any, any> = Map<keyof T, T[]>
> = {
  0: Map<keyof T, M>
  1: NestedMap<T, Len, I.Prev<Iter>, Map<keyof T, M>>
}[ N.Lower<I.Next<Iter>, Len> ]
export type NestedRollup<
  T,
  Len extends LiteralUnion<1 | 2 | 3 | 4 | 5 | 6, number> = 6,
  Iter extends I.Iteration = I.IterationOf<Len>,
  M extends Map<any, any> = Map<keyof T, number>
> = {
  0: NestedMap<T, Len, I.Prev<Iter>, Map<keyof T, M>>
  1: Map<keyof T, M>
}[ N.IsZero<I.Pos<Iter>> ]
export type NestedArray<
  T,
  Len extends LiteralUnion<1 | 2 | 3 | 4 | 5 | 6, number> = 6,
  Iter extends I.Iteration = I.IterationOf<Len>,
  M = [ keyof T, T[] ]
> = {
  0: NestedArray<T, Len, I.Prev<Iter>, [ keyof T, M[] ]>
  1: [ keyof T, M[] ]
}[ N.IsZero<I.Pos<Iter>> ]
export type NestedRollups<
  T,
  Len extends LiteralUnion<1 | 2 | 3 | 4 | 5 | 6, number> = 6,
  Iter extends I.Iteration = I.IterationOf<Len>,
  M = [ keyof T, number ]
> = {
  0: NestedArray<T, Len, I.Prev<Iter>, [ keyof T, M[] ]>
  1: [ keyof T, M[] ]
}[ N.IsZero<I.Pos<Iter>> ]
