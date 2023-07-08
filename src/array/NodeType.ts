import type {
  I, L, N,
} from 'ts-toolbelt'

import type {
  Except, Get, Simplify,
} from 'type-fest'
import type {
  BaseNode, KeyFn,
} from './types'

type GetParentDepth<Type> = Type extends { depth: infer Depth }
  ? Depth extends number
    ? N.Sub<Depth, 1>
    : never
  : never

export type NodeType<
  T,
  KeyFuncs extends L.List<KeyFn<T>>,
  Depth extends I.Iteration = I.IterationOf<KeyFuncs['length']>,
  ThisNode = BaseNode<T, I.Pos<Depth>, KeyFuncs>
> = {
  0: {
    1: NodeType<
      T,
      KeyFuncs,
      I.Prev<Depth>,
      Simplify<
        BaseNode<T, I.Pos<Depth>, KeyFuncs> &
        {
          parent: NodeType<T, KeyFuncs, I.Prev<Depth>>
        }
      >
    >
    0: NodeType<
      T,
      KeyFuncs,
      I.Prev<Depth>,
      Simplify<
        BaseNode<T, I.Pos<Depth>, KeyFuncs> &
        {
          children: ThisNode[]
          parent: NodeType<T, KeyFuncs, I.Prev<Depth>>
        }
      >
    >
  }[N.GreaterEq<I.Pos<Depth>, KeyFuncs['length']>]
  1: Simplify<
    BaseNode<T, 0, KeyFuncs> &
    {
      children: ThisNode[]
    }
  >
}[N.IsZero<I.Pos<Depth>>]
export type AncestorArray<
  Node,
  Arr extends any[] = [],
  Length extends I.Iteration = I.IterationOf<1>
> = {
  0: Simplify<Except<Arr, 'length'> & { length: I.Pos<Length> }>
  1: AncestorArray<
    Get<Node, 'parent'>,
    L.Append<Arr, Get<Node, 'parent'>>,
    I.Next<Length>
  >
}[Get<Node, 'parent'> extends object ? 1 : 0]
export type ParentType<Node, Parents extends any[] = [Node]> = {
  0: Parents[number]
  1: ParentType<Get<Node, 'parent'>, [...Parents, Get<Node, 'parent'>]>
}[Get<Node, 'parent'> extends undefined ? 1 : 0]
