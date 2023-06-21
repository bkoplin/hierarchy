import type {
  Finite,
  ReadOnlyTuple,
  Get,
  JsonObject,
  LiteralUnion,
  ValueOf,
  StringKeyOf,
} from 'type-fest';
import type { F, I, L, N, O, S } from 'ts-toolbelt';
import { InternMap } from 'd3-array'

export type GroupArguments<T> =
  | readonly [T[], KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>]
  | readonly [T[], KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>]
  | readonly [T[], KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>]
  | readonly [T[], KeyFn<T>, KeyFn<T>, KeyFn<T>]
  | readonly [T[], KeyFn<T>, KeyFn<T>]
  | readonly [T[], KeyFn<T>];

export type GroupArgumentsByLength<Len extends LiteralUnion<2|3|4|5|6|7, number>, T> = ReadOnlyTuple<KeyFn<T>, N.Sub<Len, 1>>
export type HierarchyArguments<T> =
  | readonly [
      T[],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
    ]
  | readonly [
      T[],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
    ]
  | readonly [
      T[],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
    ]
  | readonly [
      T[],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
    ]
  | readonly [
      T[],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
      StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>],
    ]
  | readonly [T[], StringKeyOf<T> | [StringKeyOf<T>, KeyFn<T>]];

export type KeyFn<T> = {
  (obj: T, idx?: number, objs?: T[]): ValueOf<T>|undefined;
};

export type KeyFns<
  T,
  FnList extends KeyFn<T>[] = [],
  Iter extends I.Iteration = I.IterationOf<6>,
> = {
  0: KeyFns<T, [...FnList, ReadOnlyTuple<KeyFn<T>, I.Pos<Iter>>], I.Prev<Iter>>;
  1: L.UnionOf<[...FnList, ReadOnlyTuple<KeyFn<T>, I.Pos<Iter>>]>;
}[N.IsZero<I.Pos<Iter>>];

export type KeyOptions<
  T,
  Len extends number,
  KeyList extends StringKeyOf<T>[] = [],
  Iter extends I.Iteration = I.IterationOf<6>,
> = {
  0: KeyOptions<
    T,
    [...KeyList, ReadOnlyTuple<StringKeyOf<T>, I.Pos<Iter>>],
    I.Prev<Iter>
  >;
  1: L.UnionOf<[...KeyList, ReadOnlyTuple<StringKeyOf<T>, I.Pos<Iter>>]>;
}[N.IsZero<I.Pos<Iter>>];

export type NestedMap<
  T,
  Len extends number,
  Iter extends I.Iteration = I.IterationOf<Len>,
  M extends Map<any, any> = Map<ValueOf<T>, T[]>
> = {
  0: Map<ValueOf<T>, M>;
  1: NestedMap<T, Len, I.Prev<Iter>, Map<ValueOf<T>, M>>;
}[N.Greater<I.Pos<I.Prev<Iter>>, 1>];
export type NestedRollup<
  T,
  Len extends LiteralUnion<1 | 2 | 3 | 4 | 5 | 6, number> = 6,
  Iter extends I.Iteration = I.IterationOf<Len>,
  M extends Map<any, any> = Map<keyof T, number>,
> = {
  0: NestedMap<T, Len, I.Prev<Iter>, Map<keyof T, M>>;
  1: Map<keyof T, M>;
}[N.IsZero<I.Pos<Iter>>];
export type NestedArray<
  T,
  Len extends LiteralUnion<1 | 2 | 3 | 4 | 5 | 6, number> = 6,
  Iter extends I.Iteration = I.IterationOf<Len>,
  M = [keyof T, T[]],
> = {
  0: NestedArray<T, Len, I.Prev<Iter>, [keyof T, M[]]>;
  1: [keyof T, M[]];
}[N.IsZero<I.Pos<Iter>>];
export type NestedRollups<
  T,
  Len extends LiteralUnion<1 | 2 | 3 | 4 | 5 | 6, number> = 6,
  Iter extends I.Iteration = I.IterationOf<Len>,
  M = [keyof T, number],
> = {
  0: NestedArray<T, Len, I.Prev<Iter>, [keyof T, M[]]>;
  1: [keyof T, M[]];
}[N.IsZero<I.Pos<Iter>>];
