import type {
  I, L, N,
} from 'ts-toolbelt'

import type {
  Except,
  Get, Simplify,
} from 'type-fest'
import type { BaseNode, } from './types'

type GetParentDepth<Type> = Type extends { depth: infer Depth }
  ? Depth extends number
    ? N.Sub<Depth, 1>
    : never
  : never

export type NodeType<
  T,
  RootHeight extends number,
  Depth extends I.Iteration = I.IterationOf<RootHeight>,
  ThisNode = BaseNode<T, I.Pos<Depth>, RootHeight>
> = {
  0: {
    1: NodeType<
      T,
      RootHeight,
      I.Prev<Depth>,
      Simplify<ThisNode & {
        parent: NodeType<T, RootHeight, I.Prev<Depth>>
      }>
    >
    0: NodeType<
      T,
      RootHeight,
      I.Prev<Depth>,
      Simplify<BaseNode<T, I.Pos<Depth>, RootHeight> & {
        children: ThisNode[]
        parent: NodeType<T, RootHeight, I.Prev<Depth>>
      }>
    >
  }[N.GreaterEq<I.Pos<Depth>, RootHeight>]
  1: Simplify<BaseNode<T, 0, RootHeight> & {
    children: ThisNode[]
  }>
}[N.LowerEq<I.Pos<Depth>, 0>]
export type AncestorArray<
  Node,
  Arr extends any[] = [],
  Length extends I.Iteration = I.IterationOf<1>
> = {
  0: Simplify<Except<Arr, 'length'> & { length: I.Pos<Length> }>
  1: AncestorArray<Get<Node, 'parent'>, L.Append<Arr, Get<Node, 'parent'>>, I.Next<Length>>
}[Get<Node, 'parent'> extends object ? 1 : 0]
