import type {
  I, N,
} from 'ts-toolbelt'

import type { BaseNode, } from './types'
import { Simplify } from 'type-fest'

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
