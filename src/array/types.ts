import type {
  I, L, N,
} from 'ts-toolbelt'
import type {
  Get,
  IterableElement,
  JsonObject,
  JsonPrimitive,
  StringKeyOf,
} from 'type-fest'

export type AncestorArray<
  Node,
  AncestorList extends L.List = []
> = Node extends {
  dim: infer NodeDim
  depth: infer NodeDepth
  height: infer NodeHeight
  parent?: infer Parent
  children?: Array<infer Child>
}
  ? Node['parent'] extends undefined
    ? [...AncestorList, Node]
    : AncestorArray<Parent, [...AncestorList, Node]>
  : never
export type DescendantArray<
  Node,
  DescendantList extends L.List = []
> = Node extends {
  dim: infer NodeDim
  depth: infer NodeDepth
  height: infer NodeHeight
  parent?: infer Parent
  children?: Array<infer Child>
}
  ? Node['children'] extends undefined
    ? [...DescendantList, Node]
    : DescendantArray<Child, [...DescendantList, Node]>
  : never
export type NodeLinks<T, Links extends L.List = []> = T extends {
  children: Array<infer Child>
}
  ? NodeLinks<Child, [...Links, { source: Get<T, ['parent']>; target: T }]>
  : [...Links, { source: Get<T, ['parent']>; target: T }]
export type NodeArray<
  T,
  Direction extends 'ancestors' | 'descendants' | 'a' | 'd' = 'descendants'
> = Direction extends 'ancestors' | 'a' ? AncestorArray<T> : DescendantArray<T>
export type GetDims<
  KeyFunctions extends readonly any[],
  Start extends number = 0
  End extends number = KeyFunctions['length'],
  Arr extends L.List = []
> = KeyFunctions extends readonly [infer KeyFn, ...infer Rest]
  ? KeyFn extends readonly [infer Dim, any]
    ? GetDims<Rest, Start, End, [...Arr, Dim]>
    : GetDims<Rest, Start, End, [...Arr, KeyFn]>
  : L.Pick<[undefined, ...Arr], L.KeySet<Start, End>>
export type NodeArrayKey<
  T,
  Key,
  Direction extends 'ancestors' | 'descendants' | 'a' | 'd' = 'descendants'
> = Key extends StringKeyOf<T>
  ? Get<IterableElement<NodeArray<T, Direction>>, [Key]>
  : never
export type DimsDepthObject<T> = Get<T, ['dims']> extends any[]
  ? {
      [K in keyof Get<T, ['dims']> as `${K & number}`]: Get<T, ['dims', K]>
    }
  : never
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
export type DepthFromDim<
  Node,
  Dim,
  Direction extends 'a' | 'ascending' | 'd' | 'descending' = 'a'
> = Node extends {
  dim: infer NodeDim
  depth: infer NodeDepth
  height: infer NodeHeight
  parent?: infer Parent
  children?: Array<infer Child>
}
  ? Dim extends NodeDim
    ? NodeDepth
    : Direction extends 'a' | 'ascending'
      ? Node['parent'] extends undefined
        ? never
        : DepthFromDim<Parent, Dim, Direction>
      : Node['children'] extends undefined
        ? never
        : DepthFromDim<Child, Dim, Direction>
  : never
export type KeyFnTuple<T> = readonly [
  string,
  (datum: T, idx?: number, vals?: T[]) => JsonPrimitive
]
export type KeyFnKey<T> = keyof T
export type KeyFn<T> = KeyFnTuple<T> | keyof T
export type GetIdFromKey<K> = K extends undefined
  ? undefined
  : K extends KeyFn<infer Datum>
    ? Datum extends JsonObject | string
      ? K extends KeyFnTuple<Datum>
        ? ReturnType<K[1]>
        : K extends KeyFnKey<Datum>
          ? Datum[K]
          : undefined
      : undefined
    : undefined
export type GetDatumFromKeyFn<K> = K extends KeyFn<infer T> ? T : never
export type GetKeyFn<
  KeyFuncs extends readonly any[],
  D extends number,
  K = Get<KeyFuncs, [`${N.Sub<D, 1>}`]>
> = K extends undefined
  ? () => undefined
  : K extends KeyFn<infer Datum>
    ? Datum extends JsonObject | string
      ? K extends KeyFnTuple<Datum>
        ? K[1]
        : K extends KeyFnKey<Datum>
          ? (datum: Datum) => Datum[K]
          : () => undefined
      : () => undefined
    : () => undefined
export type GetDim<
  KeyFuncs extends readonly any[],
  Depth extends L.KeySet<0, KeyFuncs['length']> = 0
> = Depth extends 0
  ? undefined
  : KeyFuncs[N.Sub<Depth, 1>] extends readonly [infer Dim, any]
    ? Dim
    : KeyFuncs[N.Sub<Depth, 1>] extends JsonPrimitive
      ? KeyFuncs[N.Sub<Depth, 1>]
      : undefined
