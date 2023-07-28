import { A, I, L, N, S, B, O } from 'ts-toolbelt'
import type {
  Get,
  IsNever,
  IterableElement,
  JsonObject,
  JsonPrimitive,
  StringKeyOf,
} from 'type-fest'

export type AncestorArray<Node, AncestorList extends L.List = []> = IsNever<
  Get<Node, 'parent'>
> extends false
  ? AncestorArray<Get<Node, 'parent'>, [...AncestorList, Node]>
  : [...AncestorList, Node]
export type DescendantArray<
  Node,
  DescendantList extends L.List = []
> = Node extends { children: Array<infer Child> }
  ? IsNever<Child> extends false
    ? DescendantArray<Child, [...DescendantList, ...L.List<Node>]>
    : [...DescendantList, ...L.List<Node>]
  : DescendantList
export type GetDims<
  KeyFunctions extends L.List,
  StartDepth extends number = 0,
  EndDepth extends number = L.Length<KeyFunctions>,
  Iter extends I.Iteration = I.IterationOf<StartDepth>,
  Arr extends L.List = readonly []
> = {
  1: {
    0: L.Append<Arr, GetDimFromKeyFn<KeyFunctions, I.Pos<I.Prev<Iter>>>>
    1: {
      0: GetDims<KeyFunctions, StartDepth, EndDepth, I.Next<Iter>, Arr>
      1: GetDims<
        KeyFunctions,
        StartDepth,
        EndDepth,
        I.Next<Iter>,
        I.Pos<Iter> extends 0
          ? L.Prepend<Arr, undefined>
          : L.Append<Arr, GetDimFromKeyFn<KeyFunctions, I.Pos<I.Prev<Iter>>>>
      >
    }[N.GreaterEq<I.Pos<Iter>, StartDepth>]
  }[N.Lower<I.Pos<Iter>, EndDepth>]
  0: L.List<GetDimFromKeyFn<KeyFunctions, N.Sub<StartDepth, 1>>>
}[N.Greater<EndDepth, StartDepth>]
export type GetDimOptions<
  KeyFunctions extends L.List,
  StartDepth extends number = 0,
  EndDepth extends number = L.Length<KeyFunctions>,
  Iter extends I.Iteration = I.IterationOf<StartDepth>,
  Arr extends L.List = readonly []
> = {
  1: {
    0: L.UnionOf<
      L.Append<Arr, GetDimFromKeyFn<KeyFunctions, I.Pos<I.Prev<Iter>>>>
    >
    1: {
      0: GetDimOptions<KeyFunctions, StartDepth, EndDepth, I.Next<Iter>, Arr>
      1: GetDimOptions<
        KeyFunctions,
        StartDepth,
        EndDepth,
        I.Next<Iter>,
        L.Append<Arr, GetDimFromKeyFn<KeyFunctions, I.Pos<I.Prev<Iter>>>>
      >
    }[N.GreaterEq<I.Pos<Iter>, StartDepth>]
  }[N.Lower<I.Pos<Iter>, EndDepth>]
  0: GetDimFromKeyFn<KeyFunctions, N.Sub<StartDepth, 1>>
}[N.Greater<EndDepth, StartDepth>]
export type KeyFnTuple<T> = readonly [
  string,
  (datum: T, idx?: number, vals?: T[]) => string | number | undefined
]
export type KeyFnKey<T> = T extends JsonObject
  ? StringKeyOf<T>
  : T extends string
  ? StringKeyOf<L.ObjectOf<S.Split<T, ''>>>
  : undefined
export type KeyFn<T> = KeyFnTuple<T> | KeyFnKey<T>
export type GetDatumFromKeyFn<K> = K extends KeyFn<infer T> ? T : never
export type GetDimFromKeyFn<
  KeyFunctions extends L.List,
  Idx extends number
> = A.At<KeyFunctions, Idx> extends undefined
  ? never
  : A.At<KeyFunctions, Idx> extends readonly [infer Dim, unknown]
  ? Dim extends string
    ? Dim
    : never
  : A.At<KeyFunctions, Idx> extends `${infer StringDim}`
  ? StringDim
  : never
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

type GD = GetDims<
  readonly ['ben', readonly ['guiia', () => undefined], 'eli', 'phin', 'ava'],
  0,
  4
>
