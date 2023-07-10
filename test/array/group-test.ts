import {
  describe, expect, test,
} from 'vitest'
import {
  map, mean, pipe, prop,
} from 'rambdax'
import { pick, } from 'lodash-es'
import { group, } from '../../src/array/group'
import data from '../data/MOCK_DATA.json'

const groupByAge = group(
  data,
  'education_level',
  [
    'state_letter',
    x => x.state[0],
  ],
  'state'
)

describe(
  'group function',
  () => {
    test(
      'root tests',
      () => {
        expect(groupByAge.dim).toBeUndefined()
        expect(groupByAge.depth).toBe(0)
        expect(groupByAge.parent).toBeUndefined()
      }
    )
    test(
      'first level child tests',
      () => {
        const [ child, ] = groupByAge.children

        expect(child.dim).toEqual('education_level')
        expect(child.depth).toEqual(1)
        if (child.hasChildren())
          expect(child.children).toBeTruthy()

        expect(child.parent.depth).toEqual(0)
        child.eachBefore((node) => {
          expect(node.dim).toBeGreaterThan(0)
        })
      }
    )
    test(
      'second level child dim is state',
      () => {
        expect(groupByAge.children[0].children[0].dim).toBe('state')
      }
    )
    test(
      'second level child has no children',
      () => {
        const [ child, ] = groupByAge.children[0].children

        expect(child.hasChildren()).toBe(false)
        expect(child.hasParent()).toBeTruthy()
        if (child.hasParent())
          expect(child.parent.depth).toBe(1)
      }
    )
    test(
      'second level child depth is 2',
      () => {
        expect(groupByAge.children?.[0].depth).toBe(1)
        const secondLevelChild = groupByAge.children?.[0]?.children?.[0]

        expect(secondLevelChild.depth).toBe(2)
        expect(secondLevelChild.type).toBe('leaf')
        if (secondLevelChild.hasParent())
          expect(secondLevelChild.parent.depth).toBe(1)
      }
    )
    test(
      'change value function, inline second level first child',
      () => {
        const c = groupByAge.children[0]

        c.setValueFunction(pipe(
          prop('records'),
          map(prop('crime_rate')),
          mean
        ))
        c.setColor(
          undefined,
          'allNodesAtDimValues'
        )
        expect(c).toMatchFileSnapshot('./group-children.json')
      }
    )
  }
)

describe(
  'ancestor tests',
  () => {
    test(
      'ancestors tests',
      () => {
        const [ level1Child, ] = groupByAge.leaves()
        const ancestors = level1Child.ancestors()
        const [
          firstAncestor,
          secondAncestor,
          thirdAncestor,
          root
        ] = ancestors

        expect(ancestors).toMatchFileSnapshot('./ancestors.json')
        expect(ancestors.length).toBe(3)
        expect(firstAncestor.depth).toBe(true)
        expect(secondAncestor.dim).toBe(false)
        expect(root.depth).toBe(false)
      }
    )
    test(
      'ancestorsAt depth of 1 of second level child has dim of \'education_level\'',
      () => {
        const [ leaf, ] = groupByAge.children
        const ancestor = leaf.ancestorAt({ dim: undefined, })
        const depth2 = leaf.ancestorAt({ depth: 2, })

        expect(ancestor).toBeTruthy()
        expect(ancestor.depth).toBeTruthy()
        expect(depth2.depth).toBe(2)
        expect(leaf.ancestorAt({ depth: 1, }).dim).toBe('node')
        expect(leaf.type).toBe('leaf')
      }
    )
  }
)
describe(
  'leaf node tests',
  () => {
    const [ leaf, ] = groupByAge.leaves()

    test(
      'first leaf node of root has depth of 2 and haschildren of false',
      () => {
        expect(leaf.parent.depth).toBe(1)
        expect(leaf.depth).toBe(2)
        expect(leaf.dim).toBe('state')
        expect(leaf.height).toBe(0)
        expect(leaf.hasChildren()).toBe(false)
        expect(leaf.color).toMatchInlineSnapshot('"#5e4fa2"')
      }
    )
    test(
      'first leaf node of root has dim of \'state\'',
      () => {
        expect(leaf?.dim).toBe('state')
      }
    )
  }
)
describe(
  'links tests',
  () => {
    test(
      'root generates a links json',
      () => {
        groupByAge.setColor(
          'Spectral',
          'allNodesAtDimIds'
        )
        expect(groupByAge.links().map(({
          source, target,
        }) => {
          const depth = target.depth

          return {
            source: pick(
              source,
              [
                'color',
                'id',
              ]
            ),
            target: pick(
              target,
              [
                'color',
                'id',
              ]
            ),
          }
        })).toMatchFileSnapshot('./group-links.json')
      }
    )
  }
)
describe(
  'path tests',
  () => {
    test(
      'root generates a path json',
      () => {
        const [
          first,
          last,
        ] = groupByAge.children

        expect(last
          .leaves()[0]
          .path(first.leaves()[0])
          .map(node => node.depth)).toStrictEqual([
          2,
          1,
          0,
          1,
          2,
        ])
      }
    )
  }
)
describe(
  'find tests',
  () => {
    test(
      'find returns the correct node',
      () => {
        const found = groupByAge
          .descendants()[5]
          .find(node => node.dim === 'state')
        const found2 = groupByAge.descendantsAt({ depth: 2, })

        expect(found2[0].depth).toBe(2)
        expect(found2.map(n => [
          n.id,
          n.value,
          n.color,
        ])).toMatchInlineSnapshot(`
          [
            [
              "Bachelor's Degree",
              696.4159999999999,
              "#9e0142",
            ],
            [
              "High School",
              5,
              "#f46d43",
            ],
            [
              "Some College",
              5,
              "#fee08b",
            ],
            [
              "Doctorate Degree",
              4,
              "#e6f598",
            ],
            [
              "Master's Degree",
              3,
              "#66c2a5",
            ],
            [
              "Associate's Degree",
              5,
              "#5e4fa2",
            ],
          ]
        `)
      }
    )
  }
)
describe(
  'JSON test',
  () => {
    test(
      'root generates json without parent or methods',
      () => {
        const j = groupByAge.children[0].toJSON()

        expect(j.parent).toBeUndefined()
      }
    )
  }
)
