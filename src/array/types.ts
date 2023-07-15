import type {
  B, I, L, N, S,
} from 'ts-toolbelt'
import type {
  JsonPrimitive, ValueOf,
} from 'type-fest'

export type AncestorArray<T, Arr extends L.List = []> = T extends {
  parent: infer P
}
  ? P extends undefined
    ? [...Arr, T]
    : AncestorArray<P, [...Arr, T]>
  : Arr
export type DescendantArray<T, Descendants extends L.List = [T]> = T extends {
  children: Array<infer Child>
}
  ? Child extends undefined
    ? Descendants
    : DescendantArray<Child, [...Descendants, ...T['children']]>
  : Descendants
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
  T,
  ReturnArray extends L.List = readonly []
> = T extends ReadonlyArray<infer Dim>
  ? Dim extends readonly any[]
    ? [...ReturnArray, Dim[0]]
    : [...ReturnArray, Dim]
  : ReturnArray
export type DescendantDepths<T, Arr extends L.List = []> = T extends {
  depth: infer Depth extends number
  children?: Array<infer Child>
}
  ? Child extends undefined
    ? [...Arr, Depth]
    : [...Arr, ...DescendantDepths<Child, Arr>]
  : Arr
export type DescendantDims<T, Arr extends L.List = []> = T extends {
  dim: infer Dim
  children?: Array<infer Child>
}
  ? Child extends undefined
    ? [...Arr, Dim extends readonly any[] ? Dim[0] : Dim]
    : [...Arr, ...DescendantDims<Child, Arr>]
  : Arr
export type AncestorDepths<T, Arr extends L.List = []> = T extends {
  depth: infer Depth extends number
  parent?: infer Parent
}
  ? Parent extends undefined
    ? [...Arr, Depth]
    : [...Arr, ...AncestorDepths<Parent, Arr>]
  : Arr
export type AncestorDims<T, Arr extends L.List = []> = T extends {
  dim: infer Dim
  parent?: infer Parent
}
  ? Parent extends undefined
    ? [...Arr, Dim extends readonly any[] ? Dim[0] : Dim]
    : [...Arr, ...AncestorDims<Parent, Arr>]
  : Arr
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
