import type {
  B, I, L, N, S,
} from 'ts-toolbelt'
import type {
  IterableElement, JsonPrimitive, ValueOf,
} from 'type-fest'

export type AncestorArray<T, Arr extends L.List = []> = T extends {
  parent: { children: T[] }
}
  ? AncestorArray<T['parent'], [...Arr, T]>
  : [...Arr, T]
export type DescendantArray<T, Descendants extends L.List = []> = T extends {
  children: Array<{ parent: T }>
}
  ? DescendantArray<T['children'][number], [...Descendants, T]>
  : [...Descendants, T]
export type NodeLinks<
  T extends { children?: unknown[]; parent?: unknown },
  Links extends L.List = []
> = {
  1: Links
  0: T['children'] extends Array<{ parent: T }>
    ? NodeLinks<
        T['children'][number],
        [...Links, { source: T['parent']; target: T }]
      >
    : never
}[T['children'] extends undefined ? 1 : 0]
export type NodeArray<
  T,
  Direction extends 'ancestors' | 'descendants' | 'a' | 'd' = 'descendants'
> = Direction extends 'ancestors'
  ? AncestorArray<T>
  : Direction extends 'a'
    ? AncestorArray<T>
    : DescendantArray<T>
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
export type GetDims<KeyFunctions> = KeyFunctions extends unknown[]
  ? [
      undefined,
      ...{
        [K in keyof KeyFunctions]: KeyFunctions[K] extends L.List
          ? KeyFunctions[K][0]
          : KeyFunctions[K]
      }
    ]
  : [undefined]
export type DescendantDepths<T extends { depth: unknown }> = IterableElement<
  NodeArray<T>
>['depth']
export type DescendantDims<T extends { dim: unknown }> = IterableElement<
  NodeArray<T>
>['dim']
export type AncestorDepths<T extends { depth: unknown }> = IterableElement<
  NodeArray<T, 'ancestors'>
>['depth']
export type AncestorDims<T extends { dim: unknown }> = IterableElement<
  NodeArray<T, 'ancestors'>
>['dim']
export type NodeArrayKey<
  T,
  Key,
  Direction extends 'ancestors' | 'descendants' | 'a' | 'd' = 'descendants'
> = Key extends keyof NodeArray<T, Direction>[number]
  ? NodeArray<T, Direction>[number][Key]
  : never
export type DimsDepthObject<
  T extends ReadonlyArray<any | readonly [any, any]>,
  Iter extends I.Iteration = I.IterationOf<0>
> = Record<
  I.Pos<Iter>,
  T[I.Pos<Iter>] extends [infer Dim, any]
    ? Dim extends JsonPrimitive
      ? `${Dim}`
      : never
    : T[I.Pos<I.Prev<Iter>>]
>
export type DimsDimObject<
  T extends ReadonlyArray<any | readonly [any, any]>,
  Iter extends I.Iteration = I.IterationOf<0>
> = Record<
  T[I.Pos<Iter>] extends [infer Dim, any]
    ? Dim extends JsonPrimitive
      ? `${Dim}`
      : never
    : T[I.Pos<I.Prev<Iter>>],
  I.Pos<Iter>
>
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
