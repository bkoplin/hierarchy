import type {
  ChromaStatic, Color,
} from 'chroma-js'
import type {
  B, I, L, N, U,
} from 'ts-toolbelt'
import type {
  ConditionalPick,
  Except,
  FixedLengthArray,
  IterableElement,
  JsonObject,
  JsonValue,
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

type DepthAndHeightOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

export type FilteredDepthList<
  MinVal extends number,
  MaxVal extends number,
  Ln extends number[] = [],
  Idx extends I.Iteration = I.IterationOf<0>
> = {
  0: Ln[number]
  1: FilteredDepthList<
    MinVal,
    MaxVal,
    B.And<
      N.LowerEq<DepthAndHeightOptions[I.Pos<Idx>], MaxVal>,
      N.GreaterEq<DepthAndHeightOptions[I.Pos<Idx>], MinVal>
    > extends 1
      ? [...Ln, DepthAndHeightOptions[I.Pos<Idx>]]
      : Ln,
    I.Next<Idx>
  >
}[N.Lower<I.Pos<I.Next<Idx>>, L.Length<DepthAndHeightOptions>>]
export interface BaseNode<
  T,
  Depth extends number,
  RootHeight extends number = 11
> {
  color?: string
  colorScale: StringKeyOf<ChromaStatic['brewer']> | Array<string | Color>
  colorScaleBy:
  | 'parentListIds'
  | 'allNodesAtDimIds'
  | 'parentListValues'
  | 'allNodesAtDimValues'
  colorScaleMode: 'e' | 'q' | 'l' | 'k'
  colorScaleNum: number
  depth: Depth
  dim: N.Greater<Depth, 0> extends 1 ? StringKeyOf<T> : never
  height: N.Sub<RootHeight, Depth>
  id: N.Greater<Depth, 0> extends 1 ? ValueOf<T> : never
  name: N.Greater<Depth, 0> extends 1 ? ValueOf<T> : never
  records: T[]
  type: Depth extends 0 ? 'root' : this['height'] extends 0 ? 'leaf' : 'node'
  value: number
  valueFunction: (args_0: any) => number
  new (
    depth: Depth,
    height: N.Sub<RootHeight, Depth>,
    records: T[],
    id: N.Sub<RootHeight, Depth> extends 0 ? ValueOf<T> : undefined,
    dim: N.Sub<RootHeight, Depth> extends 0 ? StringKeyOf<T> : undefined,
  ): this
  [Symbol.iterator](): Generator<this, void, unknown>
  addChild(
    child: this extends { children: Array<infer Child> } ? Child : never,
  ): void
  /**
   *
   * Finds the first ancestor node that matches the specified parameter. The parameter can be either the depth or dimension to find. If the parameter would return this node, the return value is undefined
   *
   * @template ADepth
   * @param {{ depth?: ADepth; dim?: StringKeyOf<T> }} depthOrDim A parameter indicating either the depth or the dimension of the ancestor to return.
   * @param {ADepth} [depthOrDim.depth] The depth of the ancestor to return.
   * @param {StringKeyOf<T>} [depthOrDim.dim] The dimension of the ancestor to return.
   */
  ancestorAt<ADepth extends FilteredDepthList<0, N.Sub<Depth, 1>>>(
    depthOrDim: RequireExactlyOne<
      { depth?: ADepth; dim?: StringKeyOf<T> },
      'depth' | 'dim'
    >,
  ): ADepth extends undefined
    ? BaseNode<T, FilteredDepthList<0, N.Sub<Depth, 1>>, RootHeight>
    : BaseNode<T, ADepth, RootHeight>
  /**
   * @description Returns the array of descendant nodes, starting with this node.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#descendants}
   * @see {descendants}
   */
  descendants<D>(this: D): Array<IterableElement<D>>
  /**
   * @description Returns the array of ancestors nodes, starting with this node, then followed by each parent up to the root.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#ancestors}
   * @see {ancestorAt}
   */
  ancestors(): FixedLengthArray<
    BaseNode<T, FilteredDepthList<0, Depth>, RootHeight>,
    N.Add<Depth, 1>
  >
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
    callback: (
      node: BaseNode<
        T,
        FilteredDepthList<this['depth'], RootHeight>,
        RootHeight
      >,
      index?: number,
    ) => void,
  ): this
  /**
   * Invokes the specified function for node and each descendant in post-order traversal,
   * such that a given node is only visited after all of its descendants have already been
   * visited. The specified function is passed the current descendant, the zero-based traversal
   * index, and this node. If that is specified, it is the this context of the callback.
   */
  eachAfter(
    callback: (
      node: BaseNode<
        T,
        FilteredDepthList<this['depth'], RootHeight>,
        RootHeight
      >,
      index?: number,
    ) => void,
  ): this
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
  eachBefore(
    callback: (
      node: BaseNode<
        T,
        FilteredDepthList<this['depth'], RootHeight>,
        RootHeight
      >,
      index?: number,
    ) => void,
  ): this
  hasChildren(): this is this['depth'] extends RootHeight
    ? this
    : Simplify<
        this & { children: Array<BaseNode<T, N.Add<Depth, 1>, RootHeight>> }
      >
  hasParent(): this is this['depth'] extends 0
    ? this
    : Simplify<this & { parent: BaseNode<T, N.Sub<Depth, 1>, RootHeight> }>
  /**
   * @description Returns the array of leaf nodes for this node
   *
   * @see {@link https://github.com/d3/d3-hierarchy#leaves}
   */
  leaves(): Array<BaseNode<T, RootHeight, RootHeight>>
  /**
   * Returns an array of links for this node and its descendants, where each *link* is an object that defines source and target properties. The source of each link is the parent node, and the target is a child node.
   * @see {@link https://github.com/d3/d3-hierarchy#links}
   */
  links<Type>(
    this: Type,
  ): Type extends { depth: infer ThisDepth }
    ? ThisDepth extends FilteredDepthList<0, RootHeight>
      ? Array<{
        source: ThisDepth extends 0
          ? undefined
          : BaseNode<T, N.Sub<ThisDepth, 1>, RootHeight>
        target: BaseNode<T, ThisDepth, RootHeight>
      }>
      : never
    : never
  /**
   * @description Returns the shortest path through the hierarchy from this node to the specified target node. The path starts at this node, ascends to the least common ancestor of this node and the target node, and then descends to the target node. This is particularly useful for hierarchical edge bundling.
   * @see {@link https://github.com/d3/d3-hierarchy#node_path}
   * @see {@link links}
   */
  path<EndDepth extends number>(
    end: BaseNode<T, EndDepth, RootHeight>,
  ): Array<BaseNode<T, FilteredDepthList<0, EndDepth | Depth>, RootHeight>>
  setColor<D>(
    this: D,
    scale?: this['colorScale'],
    scaleBy?: this['colorScaleBy'],
    scaleMode?: this['colorScaleMode'],
    scaleNum?: this['colorScaleNum'],
  ): void
  setValueFunction(func: (args_0: this) => number): void
  setValues(): void
  toJSON(): ConditionalPick<Except<this, 'parent'>, JsonValue>
}
