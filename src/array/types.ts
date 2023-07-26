import { L, S } from 'ts-toolbelt'
import type {
  IsNever, JsonObject, StringKeyOf
} from 'type-fest'

export type AncestorArray<
  Node,
  AncestorList extends L.List = []
> = IsNever<Node> extends true
  ? AncestorList
  : Node extends {
      parent: infer Parent
    }
  ? AncestorArray<Parent, [...AncestorList, Node]>
  : never[]
export type AncestorFromDim<Node, Dim> = IsNever<Node> extends true
  ? never
  : Node extends { dim: Dim }
  ? Node
  : Node extends { parent: infer Parent }
  ? AncestorFromDim<Parent, Dim>
  : never
export type DescendantFromDim<Node, Dim> = IsNever<Node> extends true
  ? never
  : Node extends { dim: Dim }
  ? Node[]
  : Node extends { children: Array<infer Child> }
  ? DescendantFromDim<Child, Dim>
  : never
export type DescendantArray<
  Node,
  DescendantList extends L.List = []
> = IsNever<Node> extends true
  ? DescendantList
  : Node extends {
      children: Array<infer Child>
    }
  ? DescendantArray<Child, [...DescendantList, Node]>
  : never[]
export type GetDims<
  KeyFunctions extends L.List,
  Start extends number = 0,
  End extends number = KeyFunctions['length'],
  Arr extends L.List = readonly [undefined]
> = KeyFunctions extends readonly [infer Head, ...infer Tail]
  ? Head extends readonly [infer Dim, unknown]
    ? GetDims<Tail, Start, End, [...Arr, Dim]>
    : GetDims<Tail, Start, End, [...Arr, Head]>
  : Pick<Arr, L.KeySet<Start, End>>
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
