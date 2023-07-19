import {
  A, B, type I, type L, type N, type O, 
} from 'ts-toolbelt'
import type {
  Get,
  IterableElement,
  JsonObject,
  JsonPrimitive,
  StringKeyOf,
} from 'type-fest'

export type AncestorArray<Node, AncestorList extends L.List = []> = {
  0: readonly [Node]
  1: {
    0: AncestorArray<A.At<Node & object, 'parent'>, [...AncestorList, Node]>
    1: [...AncestorList, Node]
  }[O.Has<Node & object, 'parent', undefined, 'equals'>]
}[B.And<O.HasPath<Node & object, ['parent']>, A.Extends<Node, object>>]
export type AncestorFromDim<Node, Dim> = {
  0: never
  1: {
    0: AncestorFromDim<A.At<Node & object, 'parent'>, Dim>
    1: Node
  }[O.Has<Node & object, 'dim', Dim>]
}[B.And<A.Extends<Node, object>, O.HasPath<Node & object, ['dim']>>]
export type DescendantArray<Node, DescendantList extends L.List = []> = {
  0: readonly [Node]
  1: {
    0: DescendantArray<
      A.At<Node, 'children'>[number],
      L.Append<DescendantList, L.List<Node>>
    >
    1: L.Flatten<L.Append<DescendantList, [Node]>>
  }[O.Has<Node, 'children', undefined, 'extends->'>]
}[B.And<O.HasPath<Node & object, ['children']>, A.Extends<Node, object>>]
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
  Start extends number = 0,
  End extends number = KeyFunctions['length'],
  Arr extends L.List = []
> = KeyFunctions extends readonly [infer KeyFn, ...infer Rest]
  ? KeyFn extends readonly [infer Dim, any]
    ? GetDims<Rest, Start, End, [...Arr, Dim]>
    : GetDims<Rest, Start, End, [...Arr, KeyFn]>
  : L.Extract<[undefined, ...Arr], Start, End>
export type GetIdFromKey<K> = K extends KeyFn<infer Datum>
  ? Datum extends JsonObject | string
    ? K extends KeyFnTuple<Datum>
      ? ReturnType<K[1]>
      : K extends KeyFnKey<Datum>
      ? Datum[K]
      : undefined
    : undefined
  : undefined
export type NodeArrayKey<
  T,
  Key,
  Direction extends 'ancestors' | 'descendants' | 'a' | 'd' = 'descendants'
> = Key extends StringKeyOf<T>
  ? Get<IterableElement<NodeArray<T, Direction>>, [Key]>
  : never
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
export type GetDatumFromKeyFn<K> = K extends KeyFn<infer T> ? T : never
export type GetKeyFn<
  KeyFuncs extends readonly any[],
  D extends number,
  K = Get<KeyFuncs, [`${N.Sub<D, 1>}`]>
> = K extends undefined
  ? never
  : K extends KeyFn<infer Datum>
  ? Datum extends JsonObject | string
    ? K extends KeyFnTuple<Datum>
      ? K[1]
      : K extends KeyFnKey<Datum>
      ? (datum: Datum) => Datum[K]
      : never
    : never
  : never
