import type {
  I, L, N, U,
} from 'ts-toolbelt'
import type {
  FixedLengthArray,
  IterableElement,
  JsonObject,
  Simplify,
  StringKeyOf,
  ValueOf,
} from 'type-fest'

export type KeyFn<T> =
  | readonly [
    StringKeyOf<T>,
    (datum: T, idx?: number, vals?: T[]) => ValueOf<T>
  ]
  | StringKeyOf<T>
export type KeyFns<T> =
  | readonly [KeyFn<T>]
  | readonly [KeyFn<T>, KeyFn<T>]
  | readonly [KeyFn<T>, KeyFn<T>, KeyFn<T>]
  | readonly [KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>]
  | readonly [KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>]
  | readonly [KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>, KeyFn<T>]
  | readonly [
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>
  ]
  | readonly [
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>,
    KeyFn<T>
  ]
  | readonly [
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
export type MakeDepthOptions<RootHeight extends Exclude<KeyFnsLength, 0>> =
  N.Range<0, RootHeight>
export type NumericUnion<
  Min extends number,
  Max extends number,
  Union extends number = Min,
  Iter extends I.Iteration = I.IterationOf<Min>
> = {
  0: NumericUnion<Min, Max, Union | I.Pos<I.Next<Iter>>, I.Next<Iter>>
  1: Union
}[I.Pos<I.Next<Iter>> extends Max ? 1 : 0]

interface BaseNode<T, Depth extends number, Height extends number> {
  depth: Depth
  height: Height
  value: number
  records: T[]
  id: Depth extends 0 ? ValueOf<T> : undefined
  name: Depth extends 0 ? ValueOf<T> : undefined
  dim: Depth extends 0 ? StringKeyOf<T> : undefined
  valueFunction: (args_0: this) => number
  [Symbol.iterator](this: this): Generator<this, never, unknown>
  addChild(child: BaseNode<T, N.Add<Depth, 1>, N.Sub<Height, 1>>): void
  ancestorAt<D extends number>(query: { depth: D }): BaseNode<T, D, Height>
  ancestorAt(query: { dim: string }): this | undefined
  ancestors(): FixedLengthArray<this, N.Add<Depth, 1>>
  /**
   * Invokes the specified function for node and each descendant in breadth-first order,
   * such that a given node is only visited if all nodes of lesser depth have already been
   * visited, as well as all preceding nodes of the same depth. The specified function is
   * passed the current descendant, the zero-based traversal index, and this node. If that
   * is specified, it is the this context of the callback.
   * @see {@link https://github.com/d3/d3-hierarchy#each}
   * @see {@link eachBefore}
   * @see {@link eachAfter}
   */
  each(
    this: this,
    callback: (node: IterableElement<this>, index?: number) => void,
  ): this
  /**
   * Invokes the specified function for node and each descendant in post-order traversal,
   * such that a given node is only visited after all of its descendants have already been
   * visited. The specified function is passed the current descendant, the zero-based traversal
   * index, and this node. If that is specified, it is the this context of the callback.
   */
  eachAfter(callback: (node: this, index?: number) => void): this
  /**
   * @description Returns an array of links for this node and its descendants, where each link is an object that defines source and target properties. The source of each link is the parent node, and the target is a child node.
   * @see {@link https://github.com/d3/d3-hierarchy#eachAfter}
   * @see {@link eachBefore}
   * @see {@link each}
   */
  /**
   * Invokes the specified function for node and each descendant in pre-order traversal, such
   * that a given node is only visited after all of its ancestors have already been visited.
   * The specified function is passed the current descendant, the zero-based traversal index,
   * and this node. If that is specified, it is the this context of the callback.
   * @see {@link https://github.com/d3/d3-hierarchy#eachBefore}
   * @see {@link each}
   * @see {@link eachAfter}
   */
  eachBefore(callback: (node: this, index?: number) => void): this
  hasChildren(): Height extends 0 ? false : true
  links(): Array<{
    source: BaseNode<T, N.Sub<Depth, 1>, N.Add<Height, 1>>
    target: BaseNode<T, Depth, Height>
  }>
}

export type NodeType<
  T,
  RootHeight extends number,
  Depth extends I.Iteration = I.IterationOf<RootHeight>,
  Height extends I.Iteration = I.IterationOf<0>,
  ThisNode = BaseNode<T, RootHeight, 0>
> = {
  leaf: NodeType<
    T,
    RootHeight,
    I.Prev<Depth>,
    I.Next<Height>,
    Simplify<
      ThisNode & {
        parent: BaseNode<T, I.Pos<I.Prev<Depth>>, I.Pos<I.Next<Height>>>
        leaves(): Array<BaseNode<T, RootHeight, 0>>
      }
    >
  >
  node: NodeType<
    T,
    RootHeight,
    I.Prev<Depth>,
    I.Next<Height>,
    Simplify<
      BaseNode<T, I.Pos<Depth>, I.Pos<Height>> & {
        children: ThisNode[]
        parent: BaseNode<T, I.Pos<I.Prev<Depth>>, I.Pos<I.Next<Height>>>
        leaves(): Array<BaseNode<T, RootHeight, 0>>
      }
    >
  >
  root: Simplify<
    BaseNode<T, I.Pos<Depth>, I.Pos<Height>> & {
      children: ThisNode[]
      leaves(): Array<BaseNode<T, RootHeight, 0>>
    }
  >
}[N.IsZero<I.Pos<Depth>> extends 1
  ? 'root'
  : N.IsZero<I.Pos<Height>> extends 1
    ? 'leaf'
    : 'node']

// export interface NodeClass<
//   T,
//   Depth extends KeyFnsLength,
//   RootHeight extends Exclude<KeyFnsLength, 0>,
// > {
//   new (
//     depth: NonNegativeInteger<Depth>,
//     height: N.Sub<RootHeight, Depth>,
//     records: T[],
//     id: ValueOf<T>,
//     dim: StringKeyOf<T>,
//   ): NodeType<T, Depth, RootHeight>;
//   constructor(
//     depth: NonNegativeInteger<Depth>,
//     height: N.Sub<RootHeight, Depth>,
//     records: T[],
//     id: ValueOf<T>,
//     dim: StringKeyOf<T>,
//   ): NodeType<T, Depth, RootHeight>;
// }

type TypeDepth2 = NodeType<JsonObject, 3>
