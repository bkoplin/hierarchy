import {
  describe, expect, test,
} from 'vitest'
import {
  length, paths, pipe, prop,
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
  'ancestor tests',
  () => {
    test(
      'ancestors tests',
      () => {
        const [
          firstAncestor,
          secondAncestor,
          root,
        ] = groupByAge.leaves()[0].ancestors()

        root.makePies()
        expect(root).toMatchFileSnapshot('./pies.json')
        expect(root.find(node => node.dim === 'state' && node.id === 'Missouri')).toMatchInlineSnapshot(`
          {
            "ancestorDimPath": [
              "education_level",
              "state",
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
