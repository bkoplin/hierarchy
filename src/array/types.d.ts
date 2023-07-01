import type { C, L, N, U } from 'ts-toolbelt'
import type {
  JsonObject, StringKeyOf,
  ValueOf
} from 'type-fest'

export type KeyFn<T> = readonly [
  StringKeyOf<T>,
  (datum: T, idx?: number, vals?: T[]) => ValueOf<T>
] |
  StringKeyOf<T>
export type KeyFns<T> = readonly [ KeyFn<T> ] |
  readonly [ KeyFn<T>, KeyFn<T> ] |
  readonly [ KeyFn<T>, KeyFn<T>, KeyFn<T> ] |
  readonly [ KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T> ] |
  readonly [ KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T> ] |
  readonly [ KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T> ] |
  readonly [
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>
  ] |
  readonly [
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>
  ] |
  readonly [
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>
  ]
export type KeyFnsLength = L.Length<KeyFns<JsonObject>> | 0
export type MaxDepth = U.Last<KeyFnsLength>

export type MakeDepthOptions<RootHeight extends Exclude<KeyFnsLength, 0>> = N.Range<0, RootHeight>

export type NumericUnion<Min extends number, Max extends number, Union extends number = Min, Iter extends I.Iteration = I.IterationOf<Min>> = {
  0: NumericUnion<Min, Max, Union | I.Pos<I.Next<Iter>>, I.Next<Iter>>,
  1: Union
}[I.Pos<I.Next<Iter>> extends Max ? 1 : 0]  

export type NodeType<
  T, 
  Depth extends number,
  RootHeight extends number,
  HeightIter extends I.Iteration = I.IterationOf<RootHeight>
> = {
  1: {
    1: {
      records: T[],
      id: ValueOf<T>,
      name: ValueOf<T>,
      dim: StringKeyOf<T>,
      children: Array<NodeType<T, N.Sub<RootHeight, I.Prev<HeightIter>>, RootHeight, I.Prev<HeightIter>>>,
      parent: Array<NodeType<T, N.Sub<RootHeight, I.Next<HeightIter>>, RootHeight, I.Next<HeightIter>>>,
      depth: Depth,
      height: I.Pos<HeightIter>,
      value: number,
      valueFunction: (args_0: this) => number,
      addChild(child: NodeType<T, N.Sub<RootHeight, I.Prev<HeightIter>>, RootHeight, I.Prev<HeightIter>>): void,
      hasChildren(): true
    },
    0: {
      records: T[],
      children: Array<NodeType<T, N.Sub<RootHeight, I.Prev<HeightIter>>, RootHeight, I.Prev<HeightIter>>>,
      parent?: undefined,
      depth: Depth,
      height: I.Pos<HeightIter>,
      id?: undefined,
      name?: undefined,
      dim?: undefined,
      value: number,
      valueFunction: (args_0: this) => number,
      addChild(child: NodeType<T, N.Sub<RootHeight, I.Prev<HeightIter>>, RootHeight, I.Prev<HeightIter>>): void,
      hasChildren(): true
    }
  }[N.Greater<Depth, 0>],
  0: {
    records: T[],
    id: ValueOf<T>,
    name: ValueOf<T>,
    dim: StringKeyOf<T>,
    parent: Array<NodeType<T, N.Sub<RootHeight, I.Next<HeightIter>>, RootHeight, I.Next<HeightIter>>>,
    children?: undefined,
    depth: Depth,
    height: I.Pos<HeightIter>,
    value: number,
    valueFunction: (args_0: this) => number,
    addChild(child: NodeType<T, N.Sub<RootHeight, I.Prev<HeightIter>>, RootHeight, I.Prev<HeightIter>>): void
    hasChildren(): false
  }
}[N.Greater<I.Pos<HeightIter>, 0>]

export interface NodeClass<T, Depth extends number, RootHeight extends number> {
  new (depth: Depth, height: NumericUnion<0, RootHeight>, records: T[], id: ValueOf<T>, dim: StringKeyOf<T>): NodeType<T, Depth, RootHeight>
  constructor (depth: Depth, height: Depth, records: T[], id: ValueOf<T>, dim: StringKeyOf<T>): NodeType<T, Depth, RootHeight>
}
