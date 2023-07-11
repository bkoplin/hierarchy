import type {
  B, I, L, N, S,
} from 'ts-toolbelt'
import type {
  IterableElement, ValueOf,
} from 'type-fest'

export type AncestorArray<
  T extends { parent?: any; depth: number },
  Arr extends L.List = []
> = {
  1: L.Append<Arr, T>
  0: AncestorArray<T['parent'], L.Append<Arr, T>>
}[T['depth'] extends 0 ? 1 : 0]
export type DescendantArray<
  T extends { children?: any[] },
  Arr extends L.List = [T]
> = {
  0: Arr
  1: AncestorArray<
    IterableElement<T['children']>,
    L.Append<Arr, IterableElement<T['children']>>
  >
}[T['children'] extends undefined ? 0 : 1]
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
  T extends readonly any[],
  Length extends number,
  Iter extends I.Iteration = I.IterationOf<Length>,
  ReturnArray extends L.List = []
> = {
  0: L.Prepend<ReturnArray, undefined>
  1: GetDims<
    T,
    Length,
    I.Prev<Iter>,
    L.Prepend<
      ReturnArray,
      T[I.Pos<I.Prev<Iter>>] extends readonly [infer Dim, any]
        ? Dim
        : T[I.Pos<I.Prev<Iter>>]
    >
  >
}[N.Greater<I.Pos<Iter>, 0>]
export type KeyFn<T> =
  | readonly [any, (datum: T, idx?: number, vals?: T[]) => ValueOf<T>]
  | keyof T

type DepthAndHeightOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

export type FilteredDepthList<
  MinVal extends number = 0,
  MaxVal extends number = L.Last<DepthAndHeightOptions>,
  Ln extends number[] = [],
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
