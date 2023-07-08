import type {
  ChromaStatic, Color,
} from 'chroma-js'
import type {
  B, I, L, N, U,
} from 'ts-toolbelt'
import type {
  Except,
  Get,
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
  MinVal extends number = 0,
  MaxVal extends number = L.Last<DepthAndHeightOptions>,
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
  KeyFuncs extends ReadonlyArray<KeyFn<T>> = [],
  Iter extends I.Iteration = I.IterationOf<0>
> {
  children: {
    0: undefined
    1: Array<BaseNode<T, KeyFuncs, I.Next<Iter>>>
  }[N.Lower<I.Pos<Iter>, KeyFuncs['length']>]
  color?: string
  colorScale: StringKeyOf<ChromaStatic['brewer']> | Array<string | Color>
  colorScaleBy:
  | 'parentListIds'
  | 'allNodesAtDimIds'
  | 'parentListValues'
  | 'allNodesAtDimValues'
  colorScaleMode: 'e' | 'q' | 'l' | 'k'
  colorScaleNum: number
  depth: I.Pos<Iter>
  dim: {
    1: KeyFuncs[I.Pos<I.Prev<Iter>>] extends [infer Dim, any]
      ? Dim
      : KeyFuncs[I.Pos<I.Prev<Iter>>]
    0: undefined
  }[N.Greater<I.Pos<Iter>, 0>]
  height: N.Sub<KeyFuncs['length'], I.Pos<Iter>>
  id: {
    1: ValueOf<T>
    0: undefined
  }[N.Greater<I.Pos<Iter>, 0>]
  keyFns: KeyFuncs
  name: {
    1: ValueOf<T>
    0: undefined
  }[N.Greater<I.Pos<Iter>, 0>]
  parent: {
    0: undefined
    1: BaseNode<T, KeyFuncs, I.Prev<Iter>>
  }[N.Greater<I.Pos<Iter>, 0>]
  records: T[]
  type: {
    1: {
      0: 'leaf'
      1: 'node'
    }[N.Lower<I.Pos<Iter>, KeyFuncs['length']>]
    0: 'root'
  }[N.Greater<I.Pos<Iter>, 0>]
  value: number
  valueFunction: (args_0: this) => number
  [Symbol.iterator](): Generator<BaseNode<T, KeyFuncs, I.IterationOf<FilteredDepthList<I.Pos<Iter>, KeyFuncs['length']>>>, void, unknown>
  addChild(
    child: BaseNode<T, KeyFuncs, I.Next<Iter>>,
  ): void
  /**
   * @description Returns the array of descendant nodes, starting with this node.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#descendants}
   * @see {@link ancestors}
   */
  descendants(): Array<BaseNode<T, KeyFuncs, I.IterationOf<FilteredDepthList<I.Pos<Iter>, KeyFuncs['length']>>>>
  descendantsAt<
    Param extends RequireExactlyOne<
      { depth?: FilteredDepthList<I.Pos<Iter>, KeyFuncs['length']>; dim?: keyof T },
      'depth' | 'dim'
    >
  >(
    depthOrDim: Param,
  ): Param['depth'] extends number
    ? Array<BaseNode<T, KeyFuncs, I.IterationOf<Param['depth']>>>
    : Param['dim'] extends keyof T
      ? Array<IterableElement<ReturnType<this['descendants']>>>
      : undefined
  /**
   * @description Returns the array of ancestors nodes, starting with this node, then followed by each parent up to the root.
   *
   * @see {@link https://github.com/d3/d3-hierarchy#ancestors}
   * @see {ancestorAt}
   */
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
      { depth?: FilteredDepthList<0, I.Pos<Iter>>; dim?: keyof T },
      'depth' | 'dim'
    >
  >(
    depthOrDim: Param,
  ): Param['depth'] extends number
    ? BaseNode<T, KeyFuncs, I.IterationOf<Param['depth']>>
    : Param['dim'] extends keyof T
      ? IterableElement<ReturnType<this['ancestors']>>
      : undefined
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
    callback: (node: IterableElement<this>, index?: number) => void,
  ): this
  /**
   * Invokes the specified function for node and each descendant in post-order traversal,
   * such that a given node is only visited after all of its descendants have already been
   * visited. The specified function is passed the current descendant, the zero-based traversal
   * index, and this node. If that is specified, it is the this context of the callback.
   */
  eachAfter(
    callback: (node: IterableElement<this>, index?: number) => void,
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
    callback: (node: IterableElement<this>, index?: number) => void,
  ): this
  /**
   * Returns the first node in the hierarchy from this node for which the specified filter returns a truthy value. undefined if no such node is found.
   * @see {@link https://github.com/d3/d3-hierarchy#find}
   */
  find(callBack: (node: this) => boolean): this | undefined
  hasChildren<Type extends N.Lower<I.Pos<Iter>, KeyFuncs['length']> extends 1 ? BaseNode<T, KeyFuncs, Iter> : never>(): this is Type
  hasParent<Type extends N.Greater<I.Pos<Iter>, 0> extends 1 ? BaseNode<T, KeyFuncs, Iter> : never>(): this is Type

  /**
   * @description Returns the array of leaf nodes for this node
   *
   * @see {@link https://github.com/d3/d3-hierarchy#leaves}
   */
  leaves(): Array<BaseNode<T, KeyFuncs, I.IterationOf<KeyFuncs['length']>>>
  /**
   * Returns an array of links for this node and its descendants, where each *link* is an object that defines source and target properties. The source of each link is the parent node, and the target is a child node.
   * @see {@link https://github.com/d3/d3-hierarchy#links}
   */
  links<Target extends BaseNode<T, KeyFuncs, I.IterationOf<FilteredDepthList<I.Pos<Iter>, KeyFuncs['length']>>>>(): Array<{
    source: Get<Target, 'parent'>
    target: Target
  }>
  /**
   * @description Returns the shortest path through the hierarchy from this node to the specified target node. The path starts at this node, ascends to the least common ancestor of this node and the target node, and then descends to the target node. This is particularly useful for hierarchical edge bundling.
   * @see {@link https://github.com/d3/d3-hierarchy#node_path}
   * @see {@link links}
   */
  path<EndNode, EndDepth extends EndNode extends { depth: infer Depth } ? Depth extends number ? Depth : never : never>(
    end: EndNode,
  ): Array<
    BaseNode<T, KeyFuncs, I.IterationOf<FilteredDepthList<0, EndDepth | I.Pos<Iter>>>>
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
