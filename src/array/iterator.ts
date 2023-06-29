import type { Node } from './Nodes'

export function* iterator<IteratorNode extends Node<any, number, number>>(this: IteratorNode) {
  let node = this as unknown as IteratorNode & Exclude<IteratorNode[ 'children' ], undefined>[ number ]
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
