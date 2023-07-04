import type { KeyFnsLength, } from './types'
import type { NodeType } from './NodeType'

export function* iterator() {
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
      yield node
      if ((children = (node)?.children) !== undefined)
        for (i = 0, n = children.length; i < n; ++i) next.push(children[i])
    }
  } while (next.length)
}
