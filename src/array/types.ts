import { A, B, I, L, N, O, S } from 'ts-toolbelt'
import type {
  Get,
  IsNever,
  IterableElement,
  JsonObject,
  JsonPrimitive,
  StringKeyOf,
} from 'type-fest'

export type AncestorArray<
  Node,
  AncestorList extends L.List = []
> = Node extends {
  parent: infer Parent
}
  ? IsNever<Parent> extends true
    ? [...AncestorList, Node]
    : AncestorArray<Parent, [...AncestorList, Node]>
  : never
export type AncestorFromDim<Node, Dim> = IsNever<Node> extends true
  ? never
  : Node extends { dim: Dim }
  ? Node
  : Node extends { parent: infer Parent }
  ? AncestorFromDim<Parent, Dim>
  : never
export type DescendantArray<Node, DescendantList extends any[] = []> = Node extends {
  children: Array<infer Child>
}
  ? IsNever<Child> extends true
    ? [...DescendantList, Node]
    : DescendantArray<Child, [...DescendantList, Node]>
  : never
export type GetDims<
  KeyFunctions extends readonly any[],
  Start extends number = 0,
  End extends number = KeyFunctions['length'],
  Arr extends L.List = readonly [undefined]
> = KeyFunctions extends readonly [infer Head, ...infer Tail]
  ? Head extends readonly [infer Dim, any]
    ? GetDims<Tail, Start, End, [...Arr, Dim]>
    : Head extends JsonPrimitive
    ? GetDims<Tail, Start, End, [...Arr, Head]>
    : never
  : L.Extract<Arr, Start, End>
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
  (datum: T, idx?: number, vals?: T[]) => string | number | undefined
]
export type KeyFnKey<T> = T extends JsonObject
  ? StringKeyOf<T>
  : T extends string
  ? StringKeyOf<L.ObjectOf<S.Split<T, ''>>>
  : undefined
export type KeyFn<T> = KeyFnTuple<T> | KeyFnKey<T>
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
