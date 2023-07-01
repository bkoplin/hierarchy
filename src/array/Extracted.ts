import type {
  I, L, N,
} from 'ts-toolbelt'
import type {
  ReadonlyTuple,
  RequireExactlyOne,
  Simplify,
  StringKeyOf,
  ValueOf,
} from 'type-fest'
import type {
  ChromaStatic, Color,
} from 'chroma-js'
import type { KeyFnsLength, NumericUnion, } from './types'

export interface Extracted<
  T,
  RootHeight extends Exclude<KeyFnsLength, 0>,
  HeightIter extends I.Iteration = I.IterationOf<RootHeight>
> {
  [ Symbol.iterator ]: any
  children: I.Pos<HeightIter> extends 0 ? undefined : Array<Extracted<T, RootHeight, I.Prev<HeightIter>>>
  color: string
  colorScale: StringKeyOf<ChromaStatic[ 'brewer' ]> | Array<string | Color>
  colorScaleBy: 'parentListOnly' | 'allNodesAtDim'
  colorScaleMode: 'e' | 'q' | 'l' | 'k'
  colorScaleNum: number
  name: I.Pos<HeightIter> extends RootHeight ? undefined : ValueOf<T>
  parent: I.Pos<HeightIter> extends RootHeight ? undefined : Extracted<T, RootHeight, I.Next<HeightIter>>
  value: number
  valueFunction: (args_0: this) => number
  depth: N.Sub<RootHeight, I.Pos<HeightIter>>
  height: I.Pos<HeightIter>
  records: T[]
  id: I.Pos<HeightIter> extends RootHeight ? undefined : ValueOf<T>
  dim: I.Pos<HeightIter> extends RootHeight ? undefined : StringKeyOf<T>
  /* TODO: add the missing return type */
  addChild (child: I.Pos<HeightIter> extends 0 ? never : Extracted<T, RootHeight, I.Prev<HeightIter>>): any
  /* TODO: add the missing return type */
  ancestorAt(
    depthOrDim: RequireExactlyOne<
      { depth?: NumericUnion<0, I.Pos<HeightIter>>; dim?: StringKeyOf<T> }, 'depth' | 'dim'
    >
  ): any
  ancestors(): Array<Extracted<T, RootHeight, I.Next<HeightIter>>>
  each (
    callback: (node: Extracted<T, RootHeight, number>, index?: number) => void
  ): this
  eachAfter (
    callback: (node: Extracted<T, RootHeight, number>, index?: number) => void
  ): this
  eachBefore (
    callback: (node: Extracted<T, RootHeight, number>, index?: number) => void
  ): this
  hasChildren (): this is Extracted<
    T, RootHeight, L.UnionOf<N.Range<0, N.Sub<RootHeight, 1>>>
  >
  hasParent (): this is Simplify<this & { parent: Parent } >
  leaves (): Array<Extracted<T, RootHeight, RootHeight>>
  /* TODO: add the missing return type */
  links (): any
  /* TODO: add the missing return type */
  path (end: Extracted<T, RootHeight, number>): any
  /* TODO: add the missing return type */
  setValueFunction (valueFn: this[ 'valueFunction' ]): any
  /* TODO: add the missing return type */
  setValues (): any
  /* TODO: add the missing return type */
  toJSON (
    this: Simplify<
      Extracted<T, RootHeight, number> & {
        parent?: Extracted<T, RootHeight, number>
        children?: Array<Extracted<T, RootHeight, number>>
      }
    >
  ): any
}
