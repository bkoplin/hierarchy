// test
import { DeepMerge, objectEntries } from '@antfu/utils'
import test from '../../test/data/mockData'
import {
  Prop,
  pick,
  prop,
  contains,
  pipe,
  union,
  paths,
  produce,
  equals,
  path,
  intersperse,
  update,
  assocPath,
  omit,
} from 'rambdax'
import { groupBy } from 'lodash-es'
import { Tree, TreeNode, TreeNodeOptions } from 'versatile-tree'
import type {
  FixedLengthArray,
  JsonObject,
  JsonPrimitive,
  StringKeyOf,
  ValueOf,
  Get,
} from 'type-fest'
import * as d3 from 'd3-hierarchy'

import type { L, S } from 'ts-toolbelt'
// import type { KeyFn } from './types'
// import { Node } from './Nodes'
class Node extends TreeNode {
  constructor(data?: Record<string, any>, options?: TreeNodeOptions) {
    const defaultOptions: TreeNodeOptions = {
      equals: (a, b) =>
        equals(
          pick(['id', 'dim'], a.getData()),
          pick(['id', 'dim'], b.getData())
        ),
    }
    super(data, defaultOptions)
  }

  findFirstByVals(vals: object): Node {
    return this.findFirst((v) => contains(vals, v.getData()))
  }
  findAllByVals(vals: object): Node[] {
    return this.findAll((v) => contains(vals, v.getData()))
  }
  getNodePathToNode(otherNode: Node) {
    const thisPath = this.getNodePath().reverse()
    const otherPath = otherNode.getNodePath()
    return union(thisPath, otherPath)
  }
  getSelectionPathToNode(otherNode: Node) {
    const thisPath = this.getSelectionPath().reverse()
    const otherPath = otherNode.getSelectionPath()
    return union(thisPath, otherPath)
  }
  getLinks() {
    return this.getNodePath().map((node) => ({
      source: node.getParent()?.getData(),
      target: node?.getData(),
    }))
  }
  pack(args?: {size?: FixedLengthArray<2, number>, padding?: number}) {
    const h = d3.hierarchy(this.toObject()).sum((d) => d.value)
    const p = d3.pack()
    if (args) {
      for (const [key, value] of Object.entries(args)) {
        p[key](value)
      }
    }
    return p(h).descendants().map(d => {
      const coords = pick(['r', 'x', 'y'], d)
      const node = this.findFirstByVals({ id: d.data.id, dim: d.data.dim })
      return new Node({ ...node.toObject(), ...coords })
    })
  }
}
export function group<
  Input extends JsonObject | string,
  KeyFunctions extends ReadonlyArrayArray<TupleKeyFn<Input> | KeyKeyFn<Input>>
>(
  values: Input[],
  keys: KeyFunctions,
  depth: L.KeySet<0, KeyFunctions['length']> = 0,
  tree?: Node
) {
  if (!tree)
    tree = new Node({
      id: 'root',
      name: 'root',
      dim: 'root',
      depth,
      height: keys['length'] - depth,
      records: values,
      value: values.length,
    })
  const fn = toKeyFn(keys[depth])
  const dim = toDim(keys[depth])
  const grouped = groupBy(values, fn)
  const trees = objectEntries(grouped).forEach(([id, records]) => {
    const child = new Node({
      id,
      name: id,
      dim,
      records,
      depth: depth + 1,
      height: keys['length'] - depth - 1,
      value: records.length,
    })
    tree!.addChildNode(child)
  })
  if (depth < keys['length'] - 1) {
    const children = tree!.getChildren()
    children.forEach((child) => {
      const d = child.getData()
      group(d.records, keys, d.depth, child)
    })
  }
  // }
  return tree
}

type TupleKeyFn<Datum extends string | JsonObject> = readonly [
  string,
  (datum: Datum, idx?: number, vals?: Datum[]) => string
]
type KeyKeyFn<Datum extends string | JsonObject> = Datum extends string
  ? KeyOfString<Datum>
  : StringKeyOf<Datum>

type KeyOfString<T extends string> = keyof L.ObjectOf<S.Split<T, ''>>

// function toKeyFn<
//   Datum extends string | JsonObject,
//   KeyFn extends TupleKeyFn<Datum>
// >(keyFn: KeyFn): KeyFn[1]
// function toKeyFn<
//   Datum extends string | JsonObject,
//   KeyFn extends KeyKeyFn<Datum>
// >(keyFn: KeyFn): Prop<Datum, KeyFn>
function toKeyFn<Datum extends string | JsonObject>(
  keyFn: TupleKeyFn<Datum> | KeyKeyFn<Datum>
) {
  if (typeof keyFn === 'string') return prop(keyFn)
  return keyFn[1]
}
function toDim<Datum extends string | JsonObject>(
  keyFn: TupleKeyFn<Datum> | KeyKeyFn<Datum>
) {
  if (typeof keyFn === 'string') return keyFn
  return keyFn[0]
}

if (import.meta.vitest) {
  const { describe, expect } = import.meta.vitest
  describe('test group function', () => {
    test('initial group', ({ data }) => {
      const treeByState = group(data, [
        ['state_letter', (o) => o.state[0]],
        'state',
      ])
      expect(treeByState.toObject()).toMatchFileSnapshot('./group.json')
      const treeM = treeByState.findFirstByVals({ id: 'M' })
      const treeA = treeByState.findFirstByVals({ id: 'Arkansas' })
      expect(treeM?.toObject()).toMatchFileSnapshot('./group_m.json')
      expect(
        treeM
          .getNodePathToNode(treeA)
          .map(pipe(prop('data'), paths(['id', 'dim'])))
      ).toMatchFileSnapshot('./group_m_a_path.json')
      expect(treeM?.getSelectionPath()).toMatchFileSnapshot(
        './group_m_selection_path.json'
      )
      expect(
        treeM?.getLinks().map(({ source, target }) => ({
          source: pick('id,dim', source),
          target: pick('id,dim', target),
        }))
      ).toMatchFileSnapshot('./group_m_links.json')
      expect(treeByState?.pack({size: [900, 900], padding: 20}).map(node => node.getData())).toMatchFileSnapshot(
        './group_m_pack.json'
      )
    })
  })
}
