import type { NodeType, NumericUnion, } from './types'

export function* iterator<Input, Depth extends number, RootHeight extends number>(this: NodeType<Input, Depth, RootHeight>) {
  let node = this
  let current
  let next = [ node, ]
  let children
  let i
  let n

  do {
    current = next.reverse()
    next = []
    while ((node = current.pop()) !== undefined) {
      yield node as unknown as NodeType<Input, NumericUnion<Depth, RootHeight>, RootHeight>
      if ((children = (node)?.children) !== undefined)
        for (i = 0, n = children.length; i < n; ++i) next.push(children[i])
    }
  } while (next.length)
}
