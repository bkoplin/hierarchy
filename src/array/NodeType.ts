import type {
  I, N,
} from 'ts-toolbelt'

import type { Merge, } from 'type-fest'
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
      Merge<
        ThisNode,
        {
          type: 'leaf'
          parent: NodeType<
            T,
            RootHeight,
            I.IterationOf<N.Sub<RootHeight, 1>>,
            BaseNode<T, N.Sub<RootHeight, 1>, RootHeight>
          >
        }
      >
    >
    0: NodeType<
      T,
      RootHeight,
      I.Prev<Depth>,
      Merge<
        ThisNode,
        {
          children: ThisNode[]
          parent: NodeType<
            T,
            RootHeight,
            I.IterationOf<GetParentDepth<ThisNode>>,
            BaseNode<T, GetParentDepth<ThisNode>, RootHeight>
          >
          type: 'node'
        }
      >
    >
  }[N.GreaterEq<I.Pos<Depth>, RootHeight>]
  1: Merge<ThisNode, {
    children: ThisNode[]
    type: 'root'
  }>
}[N.LowerEq<I.Pos<Depth>, 0>]
