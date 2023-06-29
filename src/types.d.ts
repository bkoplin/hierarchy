import type {
  Finite,
  ReadOnlyTuple,
  Get,
  JsonObject,
  LiteralUnion,
  ValueOf,
  StringKeyOf,
  Simplify,
} from 'type-fest';
import type { F, I, L, N, O, S } from 'ts-toolbelt';
import { InternMap } from 'd3-array';

export type GroupArguments<
  T,
  Length extends number = 1 | 2 | 3 | 4 | 5 | 6,
> = FixedLengthArray<KeyFn<T>, Length>;

export type HierarchyKeyArguments<
  T,
  Length extends number = 1 | 2 | 3 | 4 | 5 | 6,
> = FixedLengthArray<StringKeyOf<T>, Length>;

export type HierarchyFnArguments<
  T,
  Length extends number = 1 | 2 | 3 | 4 | 5 | 6,
> = FixedLengthArray<readonly [StringKeyOf<T>, KeyFn<T>], Length>;

export type KeyFns<T> = FixedLengthArray<KeyFn<T>, 1 | 2 | 3 | 4 | 5 | 6>;

export type KeyFn<T> = {
  (value: T, idx?: number, objs?: T[]): ValueOf<T>;
};

export type KeyFns<
  T,
  FnList extends KeyFn<T>[] = [],
  Iter extends I.Iteration = I.IterationOf<6>,
> = {
  0: KeyFns<T, [...FnList, ReadOnlyTuple<KeyFn<T>, I.Pos<Iter>>], I.Prev<Iter>>;
  1: L.UnionOf<[...FnList, ReadOnlyTuple<KeyFn<T>, I.Pos<Iter>>]>;
}[N.IsZero<I.Pos<Iter>>];

export type KeyOptions<
  T,
  Len extends number,
  KeyList extends StringKeyOf<T>[] = [],
  Iter extends I.Iteration = I.IterationOf<6>,
> = {
  0: KeyOptions<
    T,
    [...KeyList, ReadOnlyTuple<StringKeyOf<T>, I.Pos<Iter>>],
    I.Prev<Iter>
  >;
  1: L.UnionOf<[...KeyList, ReadOnlyTuple<StringKeyOf<T>, I.Pos<Iter>>]>;
}[N.IsZero<I.Pos<Iter>>];

export type NestedArray<
  T,
  Len extends number,
  Iter extends I.Iteration = I.IterationOf<Len>,
  M extends Array = Array<T>,
> = {
  1: Array<[ValueOf<T>, M]>;
  0: NestedArray<T, Len, I.Prev<Iter>, Array<[ValueOf<T>, M]>>;
}[N.IsZero<I.Pos<I.Prev<Iter>>>];
export type NestedMap<
  T,
  Len extends number,
  Iter extends I.Iteration = I.IterationOf<0>,
  M extends Map = Map<ValueOf<T>, T[]>,
> = {
  0: Map<ValueOf<T>, M>;
  1: NestedMap<T, Len, I.Next<Iter>, Map<ValueOf<T>, M>>;
}[Len extends I.Pos<I.Next<Iter>> ? 0 : 1];
type Family = {name: string, children: Family[]};
export type NestedFamlies<
  T,
  Len extends number,
  Iter extends I.Iteration = I.IterationOf<Len>,
  M extends Family = {name: ValueOf<T>, children: T[]},
> = {
  1: M;
  0: NestedFamlies<T, Len, I.Prev<Iter>, M<{name: ValueOf<T>, children: M[]}>>;
}[N.IsZero<I.Pos<I.Prev<Iter>>>];
export type NestedRollup<
  T,
  Len extends number,
  Iter extends I.Iteration = I.IterationOf<Len>,
  M extends InternMap<ValueOf<T>, any> = InternMap<ValueOf<T>, number>,
> = {
  1: M;
  0: NestedRollup<T, Len, I.Prev<Iter>, InternMap<ValueOf<T>, M>>;
}[N.IsZero<I.Pos<I.Prev<Iter>>>];

/**
Methods to exclude.
*/
type ArrayLengthMutationKeys = 'splice' | 'push' | 'pop' | 'shift' | 'unshift';

/**
Create a type that represents an array of the given type and length. The array's length and the `Array` prototype methods that manipulate its length are excluded in the resulting type.

@example
```
import type {FixedLengthArray} from 'type-fest';

type FencingTeam = FixedLengthArray<string, 3>;

const guestFencingTeam: FencingTeam = ['Josh', 'Michael', 'Robert'];

const homeFencingTeam: FencingTeam = ['George', 'John'];
//=> error TS2322: Type string[] is not assignable to type 'FencingTeam'

guestFencingTeam.push('Sam');
//=> error TS2339: Property 'push' does not exist on type 'FencingTeam'
```

@category Array
@see ReadonlyTuple
*/
export type FixedLengthArray<
  Element,
  Length extends number,
  ArrayPrototype = [Element, ...Element[]],
> = Simplify<
  ArrayPrototype & {
    [index: number]: Element;
    [Symbol.iterator]: () => IterableIterator<Element>;
    readonly length: Length;
  }
>;
