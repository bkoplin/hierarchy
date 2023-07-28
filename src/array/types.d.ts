import { A, I, L, N, S, B, O } from 'ts-toolbelt'
import type {
  Get,
  IsNever,
  JsonObject,
  JsonPrimitive,
  StringKeyOf,
} from 'type-fest'

export type AncestorArray<
  Node,
  AncestorList extends L.List = []
> = Node extends { parent: unknown }
  ? Node['parent'] extends never
    ? [...AncestorList, Node]
    : AncestorArray<Node['parent'], [...AncestorList, Node]>
  : AncestorList
export type DescendantArray<
  Node,
  DescendantList extends L.List = []
> = Node extends { children: unknown[] }
  ? Node['children'][number] extends never
    ? [...DescendantList, Node]
    : DescendantArray<
        Node['children'][number],
        [...DescendantList, Node]
      >
  : DescendantList
export type GetDims<
  KeyFunctions extends L.List,
  StartDepth extends number = 0,
  EndDepth extends number = L.Length<KeyFunctions>,
  Iter extends I.Iteration = I.IterationOf<StartDepth>,
  Arr extends L.List = readonly []
> = {
  1: {
    0: L.Append<Arr, GetDimFromKeyFn<KeyFunctions[I.Pos<I.Prev<Iter>>]>>
    1: {
      0: GetDims<KeyFunctions, StartDepth, EndDepth, I.Next<Iter>, Arr>
      1: GetDims<
        KeyFunctions,
        StartDepth,
        EndDepth,
        I.Next<Iter>,
        I.Pos<Iter> extends 0
          ? L.Prepend<Arr, undefined>
          : L.Append<Arr, GetDimFromKeyFn<KeyFunctions[I.Pos<I.Prev<Iter>>]>>
      >
    }[N.GreaterEq<I.Pos<Iter>, StartDepth>]
  }[N.Lower<I.Pos<Iter>, EndDepth>]
  0: L.List<GetDimFromKeyFn<KeyFunctions[N.Sub<StartDepth, 1>]>>
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
      L.Append<Arr, GetDimFromKeyFn<KeyFunctions[I.Pos<I.Prev<Iter>>]>>
    >
    1: {
      0: GetDimOptions<KeyFunctions, StartDepth, EndDepth, I.Next<Iter>, Arr>
      1: GetDimOptions<
        KeyFunctions,
        StartDepth,
        EndDepth,
        I.Next<Iter>,
        L.Append<Arr, GetDimFromKeyFn<KeyFunctions[I.Pos<I.Prev<Iter>>]>>
      >
    }[N.GreaterEq<I.Pos<Iter>, StartDepth>]
  }[N.Lower<I.Pos<Iter>, EndDepth>]
  0: GetDimFromKeyFn<KeyFunctions[N.Sub<StartDepth, 1>]>
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
export type GetDimFromKeyFn<K> = K extends readonly [infer Dim, unknown]
  ? Dim extends JsonPrimitive
    ? Dim
    : never
  : K extends JsonPrimitive
  ? K
  : undefined
export type IndexOfElement<
  Arr,
  Elem,
  Iter extends I.Iteration = I.IterationOf<0>
> = Arr extends readonly unknown[]
  ? {
      1: {
        0: IndexOfElement<Arr, Elem, I.Next<Iter>>
        1: I.Pos<Iter>
      }[Get<Arr, I.Key<Iter>> extends Elem ? 1 : 0]
      0: L.KeySet<0, N.Sub<L.Length<Arr>, 1>>
    }[N.Lower<I.Pos<Iter>, L.Length<Arr>>]
  : number

type GD = GetDims<
  readonly ['ben', readonly ['guiia', () => undefined], 'eli', 'phin', 'ava']
>
