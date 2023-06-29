import { objectEntries, } from '@antfu/utils'
import {
  filterObject, groupBy,
} from 'rambdax'
import type {
  L, N,
} from 'ts-toolbelt'
import type {
  IterableElement,
  JsonObject,
  JsonPrimitive,
  LiteralUnion,
  Simplify,
  StringKeyOf,
  ValueOf,
} from 'type-fest'

export default grp

type KeyFn<T> =
  | readonly [
    StringKeyOf<T>,
    (datum: T, idx?: number, vals?: T[]) => ValueOf<T>
  ]
  | StringKeyOf<T>

type KeyFns<T> =
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

type DepthAndHeight = L.Length<KeyFns<JsonObject>> | 0

export function grp<Input extends { [index: string | number]: JsonPrimitive }>(
  values: Input[],
  key1: KeyFn<Input>,
): RootNode<Input, 1>
export function grp<Input extends { [index: string | number]: JsonPrimitive }>(
  values: Input[],
  key1: KeyFn<Input>,
  key2: KeyFn<Input>,
): RootNode<Input, 2>
export function grp<Input extends { [index: string | number]: JsonPrimitive }>(
  values: Input[],
  key1: KeyFn<Input>,
  key2: KeyFn<Input>,
  key3: KeyFn<Input>,
): RootNode<Input, 3>
export function grp<Input extends { [index: string | number]: JsonPrimitive }>(
  values: Input[],
  key1: KeyFn<Input>,
  key2: KeyFn<Input>,
  key3: KeyFn<Input>,
  key4: KeyFn<Input>,
): RootNode<Input, 4>
export function grp<Input extends { [index: string | number]: JsonPrimitive }>(
  values: Input[],
  key1: KeyFn<Input>,
  key2: KeyFn<Input>,
  key3: KeyFn<Input>,
  key4: KeyFn<Input>,
  key5: KeyFn<Input>,
): RootNode<Input, 5>
export function grp<Input extends { [index: string | number]: JsonPrimitive }>(
  values: Input[],
  key1: KeyFn<Input>,
  key2: KeyFn<Input>,
  key3: KeyFn<Input>,
  key4: KeyFn<Input>,
  key5: KeyFn<Input>,
  key6: KeyFn<Input>,
): RootNode<Input, 6>
export function grp<
  Input extends { [index: string | number]: JsonPrimitive },
  KeyFunctions extends KeyFns<Input>
>(values: Input[], ...keys: KeyFunctions) {
  const root = new RootNode(
    keys.length,
    values
  )
  let idx = 0
  const thisNode = regroup(
    root,
    keys[idx]
  )
  let children

  while ((children = thisNode?.children) !== undefined && !!keys[idx + 1]) {
    idx++
    for (const child of children) {
      regroup(
        child,
        keys[idx]
      )
    }
  }
  return root.eachBefore((node) => {
    if (node.hasChildren())
      node.children.forEach(child => child.addParent(node))
  })

  function regroup<InputType extends Node<Input, DepthAndHeight, DepthAndHeight>>(
    node: InputType,
    keyof: KeyFn<Input>
  ): InputType {
    const depth = (node.depth + 1) as unknown as N.Add<InputType['depth'], 1>
    const height = (node.height - 1) as unknown as N.Sub<InputType['height'], 1>
    let keyFn: (d: Input) => ValueOf<Input>

    if (typeof keyof === 'string' || typeof keyof === 'number')
      keyFn = (d: Input) => d[keyof]
    else keyFn = keyof[1]
    const dim = typeof keyof === 'string' ? keyof : keyof[0]
    const groupsObject = objectEntries(groupBy(
      (x) => {
        const val = keyFn(x)

        if (val === null || typeof val === 'undefined')
          return ''
        else return val
      },
      node.records
    ))

    groupsObject.forEach((vals) => {
      const [
        key,
        records,
      ] = vals

      if (node.height > 1) {
        const child = new HierarchyNode(
          depth,
          height,
          records,
          key as ValueOf<Input>,
          dim
        )

        node.addChild(child)
      }
      else {
        const child = new LeafNode(
          depth,
          records,
          key as ValueOf<Input>,
          dim
        )

        node.addChild(child)
      }
    })

    return node
  }
}
/**
Create a type that represents an array of the given type and length. The array's length and the `Array` prototype methods that manipulate its length are excluded in the resulting type.

Note: This type does not prevent out-of-bounds access. Prefer `ReadonlyTuple` unless you need mutability.

@example
```
import type {FixedLengthArray} from 'type-fest';

type FencingTeam = FixedLengthArray<string, 3>;

const guestFencingTeam: FencingTeam = ['Josh', 'Michael', 'Robert'];

```

@category Array
*/
export type FixedLengthArray<
  Element,
  Length extends number,
  ArrayPrototype = [Element, ...Element[]]
> = ArrayPrototype & {
  [index: number]: Element
  [Symbol.iterator]: () => IterableIterator<Element>
  readonly length: Length
}

abstract class Node<T, Depth extends number, Height extends number> {
  constructor(
    public depth: Depth,
    public height: Height,
    public records: T[],
    public id: Depth extends 0 ? undefined : ValueOf<T>,
    public dim: Depth extends 0 ? undefined : StringKeyOf<T>
  ) {
  }

  [Symbol.iterator] = iterator
  children = [] as unknown as Height extends 0 ? undefined : Array<Node<T, N.Add<Depth, 1>, N.Sub<Height, 1>>>
  parent = undefined as unknown as N.Greater<Depth, 0> extends 0 ? undefined : Node<T, N.Sub<Depth, 1>, N.Add<Height, 1>>

  addChild(child: Height extends 0 ? never : Node<T, N.Add<Depth, 1>, N.Sub<Height, 1>>) {
    this.children?.push(child)
  }

  addParent(parent: N.Greater<Depth, 0> extends 0 ? undefined : Node<T, N.Sub<Depth, 1>, N.Add<Height, 1>>) {
    this.parent = parent
  }

  /**
   * Invokes the specified function for node and each descendant in breadth-first order,
   * such that a given node is only visited if all nodes of lesser depth have already been
   * visited, as well as all preceding nodes of the same depth. The specified function is
   * passed the current descendant, the zero-based traversal index, and this node. If that
   * is specified, it is the this context of the callback.
   */
  each(callback: (node: IterableElement<Node<T, number, number>>, index?: number) => void): this {
    let index = -1

    for (const node of this) {
      callback(
        node,
        ++index
      )
    }

    return this
  }

  /**
   * Invokes the specified function for node and each descendant in post-order traversal,
   * such that a given node is only visited after all of its descendants have already been
   * visited. The specified function is passed the current descendant, the zero-based traversal
   * index, and this node. If that is specified, it is the this context of the callback.
   */
  eachAfter(callback: (node: IterableElement<Node<T, number, number>>, index?: number) => void): this {
    const nodes = [ this, ] as unknown as Array<typeof node>
    const next = [] as unknown as Array<typeof node>
    let children
    let i: number, n: number
    let index = -1
    let node: IterableElement<Node<T, Depth, Height>> | undefined

    while ((node = nodes.pop()) !== undefined) {
      next.push(node)
      if ((children = node?.children) !== undefined)
        for (i = 0, n = children.length; i < n; ++i) nodes.push(children[i])
    }
    while ((node = next.pop()) !== undefined) {
      callback(
        node,
        ++index
      )
    }

    return this
  }

  /**
   * Invokes the specified function for node and each descendant in pre-order traversal, such
   * that a given node is only visited after all of its ancestors have already been visited.
   * The specified function is passed the current descendant, the zero-based traversal index,
   * and this node. If that is specified, it is the this context of the callback.
   */
  eachBefore(callback: (node: IterableElement<Node<T, number, number>>, index?: number) => void): this {
    const nodes = [ this, ] as unknown as Array<typeof node>
    let children
    let i
    let index = -1
    let node: IterableElement<Node<T, Depth, Height>> | undefined

    while ((node = nodes.pop()) !== undefined) {
      callback(
        node,
        ++index
      )
      if ((children = node?.children) !== undefined)
        for (i = children.length - 1; i >= 0; --i) nodes.push(children[i])
    }
    return this
  }

  hasChildren<Child extends Node<T, N.Add<Depth, 1>, N.Sub<Height, 1>>>(this: this | unknown): this is Simplify<Node<T, Depth, Exclude<Height, 0>> & { children: Child[] }> {
    return (this as Simplify<Node<T, Depth, Exclude<Height, 0>> & { children: Child[] }>)?.height > 0 && typeof (this as Simplify<Node<T, Depth, Exclude<Height, 0>> & { children: Child[] }>)?.children !== 'undefined'
  }

  hasParent<Parent extends Node<T, N.Sub<Depth, 1>, N.Add<Height, 1>>>(this: this | unknown): this is Simplify<Node<T, Exclude<Depth, 0>, Height> & { parent: Parent }> {
    return (this as Simplify<Node<T, Exclude<Depth, 0>, Height> & { parent: Parent }>)?.depth > 0 && typeof (this as Simplify<Node<T, Exclude<Depth, 0>, Height> & { parent: Parent }>)?.parent !== 'undefined'
  }

  toJSON(this: Simplify<Node<T, Depth, Height> & { parent?: Node<T, Depth, Height>; children?: Array<Node<T, Depth, Height>> }>) {
    const node = filterObject(
      v => v !== undefined,
      this
    )

    delete node.parent
    // if (node.height === 0)
    //   delete node.children
    return node
  }
}

class RootNode<T, Height extends LiteralUnion<Exclude<DepthAndHeight, 0>, number>> extends Node<T, 0, Height> {
  constructor(height: Height, records: T[]) {
    super(
      0,
      height,
      records,
      undefined,
      undefined
    )
    delete this.parent
    delete this.id
    delete this.dim
  }
}
class LeafNode<T, Depth extends LiteralUnion<Exclude<DepthAndHeight, 0>, number>> extends Node<T, Depth, 0> {
  constructor(depth: Depth, records: T[], id: ValueOf<T>, dim: StringKeyOf<T>) {
    super(
      depth,
      0,
      records,
      id,
      dim
    )

    delete this.children
  }
}

class HierarchyNode<
  T,
  Depth extends Exclude<DepthAndHeight, 0 | 8>,
  Height extends Exclude<DepthAndHeight, 0 | 8>
> extends Node<T, Depth, Height> {
  constructor(
    depth: Depth,
    height: Height,
    records: T[],
    id: ValueOf<T>,
    dim: StringKeyOf<T>
  ) {
    super(
      depth,
      height,
      records,
      id,
      dim
    )
  }
}
function* iterator<IteratorNode extends Node<any, number, number>>(this: IteratorNode) {
  let node = this as unknown as IteratorNode & Exclude<IteratorNode[ 'children' ], undefined>[number]
  let current
  let next = [ node, ] as unknown as [ IteratorNode, ...Exclude<IteratorNode[ 'children' ], undefined> ]
  let children: IteratorNode[ 'children' ]
  let i
  let n

  do {
    current = next.reverse()
    next = [] as unknown as [ IteratorNode, ...Exclude<IteratorNode[ 'children' ], undefined> ]
    while ((node = current.pop()) !== undefined) {
      yield node
      if ((children = (node as unknown as IteratorNode)?.children) !== undefined)
        for (i = 0, n = children.length; i < n; ++i) next.push(children[i])
    }
  } while (next.length)
}
