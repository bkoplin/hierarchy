import {
  A, I, L, N, O, S, 
} from 'ts-toolbelt'
import type {
  ConditionalKeys,
  Get,
  IsNever, JsonObject, StringKeyOf,
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
export type DescendantFromDim<Node, Dim extends string> = IsNever<Node> extends true
  ? never
  : Node extends { dim: `${Dim}` }
  ? Node
  : Node extends { children: Array<infer Child> }
  ? DescendantFromDim<Child, Dim>
  : never
export type DescendantArray<
  Node,
  DescendantList extends L.List = []
> = Node extends {
      children: Array<infer Child>
    }
  ? IsNever<Child> extends true 
    ? [...DescendantList, Node]
    : DescendantArray<Child, [...DescendantList, Node]>
  : DescendantList
export type GetDims<
  KeyFunctions extends L.List,
  Start extends number = 0,
  End extends number = KeyFunctions['length'],
  Arr extends L.List = readonly [undefined]
> = KeyFunctions extends readonly [infer Head, ...infer Tail]
  ? Head extends readonly [infer Dim, unknown]
    ? GetDims<Tail, Start, End, [...Arr, Dim]>
    : GetDims<Tail, Start, End, [...Arr, Head]>
  : L.Extract<Arr, Start, End>
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
export type IndexOfElement<
  Arr extends L.List,
  Elem,
  Iter extends I.Iteration = I.IterationOf<0>
> = {
  1: {
    1: I.Pos<Iter>
    0: IndexOfElement<Arr, Elem, I.Next<Iter>>
  }[A.Contains<L.ObjectOf<Arr>, Record<I.Key<Iter>, Elem>>]
  0: never
}[N.Lower<I.Pos<Iter>, L.Length<Arr>>]

