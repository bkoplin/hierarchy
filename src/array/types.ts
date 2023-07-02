import type {
  B,
  I, L, N, U,
} from 'ts-toolbelt'
import type {
  ConditionalPick,
  Except,
  FixedLengthArray,
  IterableElement,
  JsonArray,
  JsonObject,
  JsonPrimitive,
  RequireExactlyOne,
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
  Min extends number = 0,
  Max extends number = MaxDepth,
  Union extends number = Min,
  Iter extends I.Iteration = I.IterationOf<Min>
> = {
  0: NumericUnion<Min, Max, Union | I.Pos<I.Next<Iter>>, I.Next<Iter>>
  1: Union
}[I.Pos<I.Next<Iter>> extends Max ? 1 : 0]

type DepthAndHeightOptions = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ]

type FilteredDepthList<MinVal extends number, MaxVal extends number, Ln extends number[] = [], Idx extends I.Iteration = I.IterationOf<0>> = {
  0: Ln[number]
  1: FilteredDepthList< MinVal, MaxVal, B.And<N.LowerEq<DepthAndHeightOptions[I.Pos<Idx>], MaxVal>, N.GreaterEq<DepthAndHeightOptions[I.Pos<Idx>], MinVal>> extends 1 ? [...Ln, DepthAndHeightOptions[I.Pos<Idx>]] : Ln, I.Next<Idx>>
}[N.Lower<I.Pos<I.Next<Idx>>, L.Length<DepthAndHeightOptions>>]

export interface BaseNode<T, Depth extends number = KeyFnsLength, Height extends number = KeyFnsLength, RootHeight extends number = 11> {
  depth: Depth
  dim: Depth extends 0 ? undefined : StringKeyOf<T>
  height: Height
  id: Depth extends 0 ? undefined : ValueOf<T>
  name: Depth extends 0 ? undefined : ValueOf<T>
  parent: BaseNode<T, N.Sub<Depth, 1>, N.Add<Height, 1>, RootHeight>
  records: T[]
  type: Depth extends 0 ? 'root' : Height extends 0 ? 'leaf' : 'node'
  value: number
  valueFunction: (args_0: this) => number
  new (
    depth: Depth,
    height: Height,
    records: T[],
    id: Height extends 0 ? ValueOf<T> : undefined,
    dim: Height extends 0 ? StringKeyOf<T> : undefined,
  ): this
  [Symbol.iterator](this: this): Generator<BaseNode<T, FilteredDepthList<Depth, RootHeight>, FilteredDepthList<0, Depth>, RootHeight>, never, unknown>
  addChild(child: BaseNode<T, N.Add<Depth, 1>, N.Sub<Height, 1>, RootHeight>): void
  /**
   *
   * Finds the first ancestor node that matches the specified parameter. The parameter can be either the depth or dimension to find.
   *
   * @param depthOrDim A parameter indicating either the depth or the dimension of the ancestor to return.
   */
  ancestorAt(
    depthOrDim: RequireExactlyOne<
      { depth?: FilteredDepthList<0, Depth>; dim?: StringKeyOf<T> },
      'depth' | 'dim'
    >,
  ): BaseNode<T, FilteredDepthList<0, Depth>, FilteredDepthList<Height, RootHeight>, RootHeight> | undefined
  /**
   * @description Returns the array of ancestors nodes, starting with this node, then followed by each parent up to the root.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#ancestors}
   * @see {ancestorAt}
   */
  ancestors(): FixedLengthArray<BaseNode<T, FilteredDepthList<0, Depth>, FilteredDepthList<Height, RootHeight>, RootHeight>, N.Add<Depth, 1>>
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
  eachAfter(callback: (node: IterableElement<this>, index?: number) => void): this
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
  eachBefore(callback: (node: IterableElement<this>, index?: number) => void): this
  hasChildren(): this is Height extends 0 ? never : BaseNode<T, FilteredDepthList<0, Depth>, FilteredDepthList<0, Height>, RootHeight>
  /**
   * @description Returns the array of leaf nodes for this node
   *
   * @see {@link https://github.com/d3/d3-hierarchy#leaves}
   */
  leaves(): Array<BaseNode<T, RootHeight, 0, RootHeight>>
  /**
   * Returns an array of links for this node and its descendants, where each *link* is an object that defines source and target properties. The source of each link is the parent node, and the target is a child node.
   * @see {@link https://github.com/d3/d3-hierarchy#links}
   */
  links(): Array<{
    source: BaseNode<T, FilteredDepthList<Depth, RootHeight>, FilteredDepthList<0, Height>, RootHeight>
    target: BaseNode<T, FilteredDepthList<N.Add<Depth, 1>, RootHeight>, FilteredDepthList<N.Sub<Height, 1>, RootHeight>>
  }>
  /**
   * @description Returns the shortest path through the hierarchy from this node to the specified target node. The path starts at this node, ascends to the least common ancestor of this node and the target node, and then descends to the target node. This is particularly useful for hierarchical edge bundling.
   * @see {@link https://github.com/d3/d3-hierarchy#node_path}
   * @see {@link links}
   */
  path<EndDepth extends number, EndHeight extends number>(end: BaseNode<T, EndDepth, EndHeight>): Array<BaseNode<T, FilteredDepthList<0, EndDepth | Depth>, FilteredDepthList<EndHeight | Height, RootHeight>, RootHeight>>
  setValueFunction(func: (args_0: this) => number): void
  setValues(): void
  toJSON(): ConditionalPick<Except<this, 'parent'>, JsonPrimitive | JsonArray>
}
export type NodeType<
  T,
  RootHeight extends number,
  Depth extends I.Iteration = I.IterationOf<RootHeight>,
  Height extends I.Iteration = I.IterationOf<0>,
  ThisNode = BaseNode<T, RootHeight, 0, RootHeight>
> = {
  leaf: NodeType<
    T,
    RootHeight,
    I.Prev<Depth>,
    I.Next<Height>,
    Simplify<
      ThisNode
    >
  >
  node: NodeType<
    T,
    RootHeight,
    I.Prev<Depth>,
    I.Next<Height>,
    Simplify<
      BaseNode<T, I.Pos<Depth>, I.Pos<Height>, RootHeight> & {
        parent: BaseNode<T, I.Pos<I.Prev<Depth>>, I.Pos<I.Next<Height>>, RootHeight>
        children: ThisNode[]
      }
    >
  >
  root: Simplify<
    Except<BaseNode<T, I.Pos<Depth>, I.Pos<Height>, RootHeight>, 'parent'> & {
      children: ThisNode[]
    }
  >
}[N.IsZero<I.Pos<Depth>> extends 1
  ? 'root'
  : N.IsZero<I.Pos<Height>> extends 1
    ? 'leaf'
    : 'node']
