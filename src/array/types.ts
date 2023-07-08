import type {
  ChromaStatic, Color,
} from 'chroma-js'
import type {
  B, I, L, N, U,
} from 'ts-toolbelt'
import type {
  Except,
  IterableElement,
  JsonObject,
  RequireExactlyOne,
  StringKeyOf,
  ValueOf,
} from 'type-fest'
import type { AncestorArray, } from './NodeType'

export type KeyFn<T> =
  | readonly [keyof T, (datum: T, idx?: number, vals?: T[]) => ValueOf<T>]
  | keyof T
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
  KeyFuncs extends ReadonlyArray<KeyFn<T>> = []
> {
  children: N.Lower<Depth, KeyFuncs['length']> extends 1 ? Array<BaseNode<T, N.Add<Depth, 1>, KeyFuncs>> : []
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
  dim: N.Greater<Depth, 0> extends 1
    ? KeyFuncs[N.Sub<Depth, 1>] extends [infer Dim, any]
      ? Dim
      : KeyFuncs[N.Sub<Depth, 1>]
    : undefined
  height: N.Sub<KeyFuncs['length'], Depth>
  id: N.Greater<Depth, 0> extends 1 ? ValueOf<T> : undefined
  name: N.Greater<Depth, 0> extends 1 ? ValueOf<T> : undefined
  parent: N.Greater<Depth, 0> extends 1 ? BaseNode<T, N.Sub<this['depth'], 1>, KeyFuncs> : undefined
  records: T[]
  type: Depth extends 0 ? 'root' : this['height'] extends 0 ? 'leaf' : 'node'
  value: number
  valueFunction: (args_0: this) => number
  new (
    depth: Depth,
    height: N.Sub<KeyFuncs['length'], Depth>,
    records: T[],
    id: N.Sub<KeyFuncs['length'], Depth> extends 0 ? ValueOf<T> : undefined,
    dim: N.Sub<KeyFuncs['length'], Depth> extends 0 ? keyof T : undefined,
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
   * @param {{ depth?: ADepth; dim?: keyof T }} depthOrDim A parameter indicating either the depth or the dimension of the ancestor to return.
   * @param {ADepth} [depthOrDim.depth] The depth of the ancestor to return.
   * @param {keyof T} [depthOrDim.dim] The dimension of the ancestor to return.
   */
  ancestorAt<
    Param extends RequireExactlyOne<
      { depth?: FilteredDepthList<0, Depth>; dim?: keyof T },
      'depth' | 'dim'
    >
  >(
    depthOrDim: Param,
  ): Param['depth'] extends number
    ? N.LowerEq<Param['depth'], Depth> extends 1
      ? BaseNode<T, Param['depth'], KeyFuncs>
      : undefined
    : Param['dim'] extends keyof T
      ? IterableElement<ReturnType<this['ancestors']>>
      : undefined
  /**
   * @description Returns the array of descendant nodes, starting with this node.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#descendants}
   * @see {@link ancestors}
   */
  descendants(): Array<BaseNode<T, FilteredDepthList<Depth, KeyFuncs['length']>, KeyFuncs>>
  descendantsAt<
    Param extends RequireExactlyOne<
      { depth?: FilteredDepthList<Depth, KeyFuncs['length']>; dim?: keyof T },
      'depth' | 'dim'
    >
  >(
    depthOrDim: Param,
  ): Param['depth'] extends number
    ? N.GreaterEq<Param['depth'], Depth> extends 1
      ? Array<BaseNode<T, Param['depth'], KeyFuncs>>
      : undefined
    : Param['dim'] extends keyof T
      ? ReturnType<this['descendants']>
      : undefined
  /**
   * @description Returns the array of ancestors nodes, starting with this node, then followed by each parent up to the root.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#ancestors}
   * @see {ancestorAt}
   */
  ancestors(): AncestorArray<this>
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
    callback: (node: BaseNode<
      T,
      FilteredDepthList<Depth, KeyFuncs['length']>,
      KeyFuncs
    >, index?: number) => void,
  ): this
  /**
   * Invokes the specified function for node and each descendant in post-order traversal,
   * such that a given node is only visited after all of its descendants have already been
   * visited. The specified function is passed the current descendant, the zero-based traversal
   * index, and this node. If that is specified, it is the this context of the callback.
   */
  eachAfter(
    callback: (node: BaseNode<
      T,
      FilteredDepthList<Depth, KeyFuncs['length']>,
      KeyFuncs
    >, index?: number) => void,
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
    callback: (node: BaseNode<
      T,
      FilteredDepthList<Depth, KeyFuncs['length']>,
      KeyFuncs
    >, index?: number) => void,
  ): this
  /**
   * Returns the first node in the hierarchy from this node for which the specified filter returns a truthy value. undefined if no such node is found.
   * @see {@link https://github.com/d3/d3-hierarchy#find}
   */
  find(callBack: (node: this) => boolean): this | undefined
  hasChildren(): N.Lower<Depth, KeyFuncs['length']> extends 1 ? true : false
  hasParent(): N.Greater<Depth, 0> extends 1 ? true : false

  /**
   * @description Returns the array of leaf nodes for this node
   *
   * @see {@link https://github.com/d3/d3-hierarchy#leaves}
   */
  leaves(): Array<BaseNode<T, KeyFuncs['length'], KeyFuncs>>
  /**
   * Returns an array of links for this node and its descendants, where each *link* is an object that defines source and target properties. The source of each link is the parent node, and the target is a child node.
   * @see {@link https://github.com/d3/d3-hierarchy#links}
   */
  links<Type extends this>(): Array<{
    source: Type['depth'] extends 0
      ? undefined
      : BaseNode<T, N.Sub<Type['depth'], 1>, KeyFuncs>
    target: BaseNode<T, Type['depth'], KeyFuncs>
  }>
  /**
   * @description Returns the shortest path through the hierarchy from this node to the specified target node. The path starts at this node, ascends to the least common ancestor of this node and the target node, and then descends to the target node. This is particularly useful for hierarchical edge bundling.
   * @see {@link https://github.com/d3/d3-hierarchy#node_path}
   * @see {@link links}
   */
  path<EndDepth extends number>(
    end: BaseNode<T, EndDepth, KeyFuncs>,
  ): Array<
    BaseNode<T, FilteredDepthList<0, EndDepth | this['depth']>, KeyFuncs>
  >
  setColor(
    scale?: this['colorScale'],
    scaleBy?: this['colorScaleBy'],
    scaleMode?: this['colorScaleMode'],
    scaleNum?: this['colorScaleNum'],
  ): void
  setValueFunction(func: (args_0: this) => number): void
  setValues(): void
  toJSON<Type>(
    this: Type,
  ): Type extends { parent: any } ? Except<Type, 'parent'> : T
}
