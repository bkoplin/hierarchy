import type {
  B, I, L, N, O, S,
} from 'ts-toolbelt'
import type {
  ConditionalExcept,
  ConditionalKeys,
  ConditionalPick,
  Simplify, ValueOf,
} from 'type-fest'

export type AncestorArray<T, Arr extends any[] = []> = T extends {
  parent: infer P
}
  ? [T, ...AncestorArray<P, Arr>]
  : Arr
export type DescendantArray<T, Arr extends L.List = [T]> = T extends {
  children: Array<infer P>
}
  ? [T, ...DescendantArray<P, Arr>]
  : Arr
export type NumRange<
  Min extends number = 0,
  Max extends number = N.Add<Min, 1>,
  Rules extends `${'[' | '('}${']' | ')'}` = '[]',
  TrueMin extends number = S.Split<Rules, ''>[0] extends '['
    ? Min
    : N.Add<Min, 1>,
  TrueMax extends number = S.Split<Rules, ''>[1] extends ']'
    ? Max
    : N.Sub<Max, 1>
> = N.Greater<TrueMax, TrueMin> extends 1
  ? N.Range<TrueMin, TrueMax>[number]
  : TrueMin
export type GetDims<
  T extends ReadonlyArray<any | readonly [any, any]>,
  Length extends L.Length<T>,
  Iter extends I.Iteration = I.IterationOf<Length>,
  ReturnArray extends L.List = readonly []
> = {
  0: L.Append<ReturnArray, undefined>
  1: GetDims<
    T,
    Length,
    I.Prev<Iter>,
    L.Append<
      ReturnArray,
      T[I.Pos<I.Prev<Iter>>] extends [infer Dim, any]
        ? Dim
        : T[I.Pos<I.Prev<Iter>>]
    >
  >
}[N.Greater<I.Pos<Iter>, 0>]
export type DimsDepthObject<
  T extends ReadonlyArray<any | readonly [any, any]>,
  Length extends L.Length<T>
> = {
  [K in keyof GetDims<T, Length>]: GetDims<T, Length>[K]
}
export type DimsDimObject<
  T extends ReadonlyArray<any | readonly [any, any]>,
  Length extends L.Length<T>
> = O.Invert<DimsDepthObject<T, Length>>
export type KeyFn<T> =
  | [string, (datum: T, idx?: number, vals?: T[]) => ValueOf<T>]
  | keyof T

type DepthAndHeightOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

export type FilteredDepthList<
  MinVal extends number = 0,
  MaxVal extends number = L.Last<DepthAndHeightOptions>,
  Ln extends L.List<number> = [],
  Idx extends I.Iteration = I.IterationOf<0>
> = {
  0: Ln[number]
  1: FilteredDepthList<
    MinVal,
    MaxVal,
    B.And<
      N.LowerEq<DepthAndHeightOptions[I.Pos<Idx>], MaxVal>,
      N.GreaterEq<DepthAndHeightOptions[I.Pos<Idx>], MinVal>
    > extends 1
      ? [...Ln, DepthAndHeightOptions[I.Pos<Idx>]]
      : Ln,
    I.Next<Idx>
  >
}[N.Lower<I.Pos<I.Next<Idx>>, L.Length<DepthAndHeightOptions>>]
