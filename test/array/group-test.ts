import {
  describe, expect, test,
} from 'vitest'
import {
  length,
  map, mean, paths, pipe, prop,
} from 'rambdax'
import { group, } from '../../src/group'
import data from '../data/MOCK_DATA.json'

const groupByAge = group(
  data,
  'education_level',
  // [
  //   'state_letter' as const,
  //   x => x.state[0],
  // ],
  'state'
)

describe(
  'group function',
  () => {
    test(
      'root tests',
      () => {
        expect(groupByAge?.descendantDimPath).toMatchObject([
          undefined,
          'education_level',
          'state',
        ])
        expect(groupByAge.height).toBe(2)
        expect(groupByAge.parent).toBeUndefined()
        const descendants = groupByAge.descendants()

        expect(descendants.map(d => d.dim)).toMatchFileSnapshot('./group-children.json')
        const [ l, ] = groupByAge.links()

        groupByAge.eachBefore((node) => {
          const d = node.depth
        })
        expect(l.source).toBeUndefined()
      }
    )
    test(
      'change value function, inline second level first child',
      () => {
        const c = groupByAge.children[0].parent

        groupByAge.setValueFunction(pipe(
          prop('records'),
          length
        ))
        groupByAge.setColor({ colorScaleBy: 'allNodesAtDimValues', })
        expect(groupByAge.leaves().map(d => [
          d.id,
          d.value,
          d.color,
        ])).toMatchFileSnapshot('./group-colors.json')
        const [
          leaf1,
          leaf2,
        ] = groupByAge.leaves()

        expect(leaf1
          .path(leaf2)
          .map(p => paths(
            [
              'id',
              'dim',
              'value',
              'height',
              'depth',
            ],
            p
          ))).toMatchFileSnapshot('./group-path.json')
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
        const groupAncestor = groupByAge.children[0]
        const ancestors = level1Child.ancestors()
        const [
          firstAncestor,
          secondAncestor,
          root,
        ] = ancestors
        const [
          r,
          desc,
        ] = groupByAge.descendants()
        const dep = desc.depth

        expect(ancestors).toMatchFileSnapshot('./ancestors.json')
        expect(ancestors.length).toBe(3)
        const ansc = secondAncestor.ancestorAt({ dim: 'state', })
        const ansc2 = firstAncestor.ancestorAt({ dim: 'state', })
        const ansc2dims = secondAncestor.descendantDimPath

        expect(ansc2.depth).toBe(2)
        expect(secondAncestor.ancestorDimPath).toMatchInlineSnapshot(`
          [
            "education_level",
          ]
        `)
        expect(root.depth).toBe(0)
        root.makePies()
        expect(root).toMatchFileSnapshot('./pies.json')
      }
    )
    test(
      'ancestorsAt depth of 1 of second level child has dim of \'education_level\'',
      () => {
        const [ leaf, ] = groupByAge.leaves()
        const ancestor = leaf.ancestorAt({ dim: 'education_level', })
        const depth2 = leaf.ancestorAt({ depth: 2, })
        const found = groupByAge.descendantsAt({ dim: 'state', })

        expect(ancestor).toBeTruthy()
        expect(ancestor.depth).toBeTruthy()
        expect(depth2.depth).toBe(2)
        expect(leaf.ancestorAt({ depth: 1, }).dim).toMatchInlineSnapshot('"education_level"')
        expect(groupByAge.type).toBe('leaf')
      }
    )
  }
)
// describe(
//   'leaf node tests',
//   () => {
//     const [ leaf, ] = groupByAge.leaves()
//     const ancestor = leaf.ancestorAt({ dim: 'state_letter', })

//     test(
//       'first leaf node of root has depth of 2 and haschildren of false',
//       () => {
//         expect(leaf.parent.depth).toBe(1)
//         expect(leaf.depth).toBe(2)
//         expect(leaf.dim).toBe('state')
//         expect(leaf.height).toBe(0)
//         expect(leaf.hasChildren()).toBe(false)
//         expect(leaf.color).toMatchInlineSnapshot('"#5e4fa2"')
//       }
//     )
//     test(
//       "first leaf node of root has dim of 'state'",
//       () => {
//         expect(leaf?.dim).toBe('state')
//       }
//     )
//   }
// )
// describe(
//   'links tests',
//   () => {
//     test(
//       'root generates a links json',
//       () => {
//         groupByAge.setColor(
//           'Spectral',
//           'allNodesAtDimIds'
//         )
//         // expect(groupByAge.links().map(({
//         //   source, target,
//         // }) => {
//         //   const depth = target.depth

//         //   return {
//         //     source: pick(
//         //       source,
//         //       [
//         //         'color',
//         //         'id',
//         //       ]
//         //     ),
//         //     target: pick(
//         //       target,
//         //       [
//         //         'color',
//         //         'id',
//         //       ]
//         //     ),
//         //   }
//         // })).toMatchFileSnapshot('./group-links.json')
//       }
//     )
//   }
// )
// describe(
//   'path tests',
//   () => {
//     test(
//       'root generates a path json',
//       () => {
//         const [
//           first,
//           last,
//         ] = groupByAge.children
//         const paths = last.leaves()[0].path(first.leaves()[0])
//         const l = paths.length

//         expect(paths.map((node) => node.depth)).toStrictEqual([
//           2,
//           1,
//           0,
//           1,
//           2,
//         ])
//       }
//     )
//   }
// )
// describe(
//   'find tests',
//   () => {
//     test(
//       'find returns the correct node',
//       () => {
//         const found = groupByAge.descendantsAt({ dim: 'state', })
//         const found2 = groupByAge.descendantsAt({ depth: 1, })

//         expect(found[0].depth).toBe(2)
//         expect(found2.map((n) => [
//           n.id,
//           n.value,
//           n.color,
//           n.depth,
//         ]))
//           .toMatchInlineSnapshot(`
//           [
//             [
//               "Bachelor's Degree",
//               696.4159999999999,
//               "#9e0142",
//             ],
//             [
//               "High School",
//               5,
//               "#f46d43",
//             ],
//             [
//               "Some College",
//               5,
//               "#fee08b",
//             ],
//             [
//               "Doctorate Degree",
//               4,
//               "#e6f598",
//             ],
//             [
//               "Master's Degree",
//               3,
//               "#66c2a5",
//             ],
//             [
//               "Associate's Degree",
//               5,
//               "#5e4fa2",
//             ],
//           ]
//         `)
//       }
//     )
//   }
// )
// describe(
//   'JSON test',
//   () => {
//     test(
//       'root generates json without parent or methods',
//       () => {
//         const j = groupByAge.children[0].toJSON()

//         expect(j.parent).toBeUndefined()
//       }
//     )
//   }
// )
