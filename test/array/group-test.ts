import {
  describe, expect, test,
} from 'vitest'

import { group, } from '../../src/group'
import data from '../data/MOCK_DATA.json'

const groupByAge = group(
  data,
  'education_level',
  [
    'state_letter' as const,
    x => x.state[0],
  ],
  'state'
)

describe(
  'ancestor tests',
  () => {
    test(
      'ancestors tests',
      () => {
        const leaves = groupByAge.leaves()
        const [ leaf, ] = leaves
        const [
          firstAncestor,
          secondAncestor,
          root,
        ] = leaf.ancestors()

        expect(firstAncestor.dim).toBe(0)
        expect(secondAncestor.dim).toBe(0)
        expect(secondAncestor.height).toBe(2)
        expect(firstAncestor.ancestorAt({ dim: 'education_level', })?.depth).toBe(1)
        expect(secondAncestor.ancestorDimPath).toMatchInlineSnapshot(`
          [
            "state",
            "education_level",
            undefined,
          ]
        `)
        expect(root.idObject).toMatchInlineSnapshot(`
          {
            "undefined": undefined,
          }
        `)
        expect(firstAncestor.idPath({ noRoot: true, })).toMatchInlineSnapshot(`
          [
            "Missouri",
            "Bachelor's Degree",
          ]
        `)
        expect(firstAncestor.descendantDimPath).toMatchInlineSnapshot(`
          [
            "state",
          ]
        `)
        expect(root.ancestorDimPath).toMatchInlineSnapshot(`
          [
            undefined,
          ]
        `)
        expect(root.descendantDimPath).toMatchInlineSnapshot(`
          [
            undefined,
            "education_level",
            "state",
          ]
        `)
        root.makePies()
        const d = groupByAge.descendants().map(desc => desc.dim)

        expect(root).toMatchFileSnapshot('./pies.json')
        expect(root.find(node => node.dim === 'state' && node.id === 'Missouri')).toMatchInlineSnapshot(`
          {
            "ancestorDimPath": [
              "state",
              "education_level",
              undefined,
            ],
            "color": "#cccccc",
            "colorScale": "Spectral",
            "colorScaleBy": "allNodesAtDimIds",
            "colorScaleMode": "e",
            "colorScaleNum": 1,
            "depth": 2,
            "descendantDimPath": [
              "state",
            ],
            "dim": "state",
            "dims": [
              undefined,
              "education_level",
              "state",
            ],
            "endAngle": 0.23271056693257725,
            "height": 0,
            "id": "Missouri",
            "keyFns": [
              "education_level",
              "state",
            ],
            "name": "Missouri",
            "padAngle": 0,
            "records": [
              {
                "crime_rate": 998.33,
                "education_level": "Bachelor's Degree",
                "ethnicity": "Two or More Races",
                "median_age": 16,
                "median_income": 15379,
                "population": 6909596,
                "poverty_rate": 79.28,
                "region": "South",
                "state": "Missouri",
                "unemployment_rate": 43.28,
              },
            ],
            "startAngle": 0,
            "value": 1,
          }
        `)
      }
    )
  }
)
