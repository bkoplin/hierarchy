import {
  describe, expect, test,
} from 'vitest'
import yaml from 'yaml'
import safeStableStringify from 'safe-stable-stringify'

import {
  at, pick, sumBy,
} from 'lodash-es'
import { omit, } from 'rambdax'
import { hierarchy, } from '../../src/hierarchy/index'

import data from '../data/MOCK_DATA.json'

const nested = hierarchy(
  data,
  'region',
  'education_level',
  'state'
)

nested.setColors([
  'Paired',
  'Accent',
  [
    'RdYlGn',
    { mode: 'q', },
  ],
])
describe(
  'depth and height',
  () => {
    test(
      'depth',
      () => expect(nested.leaves()?.[0].depth).toBe(4)
    )
    test(
      'height',
      () => expect(nested.height).toBe(4)
    )
  }
)
describe(
  'dim, ID and paths',
  () => {
    test(
      'dim of first child to equal \'state\'',
      () => {
        expect(nested.children?.[0].dim).toBe('region')
      }
    )
    test(
      'id test',
      () => {
        expect(nested.children?.[0].id).toMatchInlineSnapshot('"Midwest"')
      }
    )
    test(
      'color test',
      () => {
        expect(nested.descendants()?.map(d => [
          d.id,
          d.color,
        ])).toMatchFileSnapshot('./outputs/colors.json')
        const descendantNode = nested.descendants()[10]
        const currentColor = descendantNode?.color

        expect(currentColor).toMatchInlineSnapshot('undefined')
        descendantNode.setColor('Blues')
        expect(descendantNode?.color).toMatchInlineSnapshot('"#08306b"')
        expect(descendantNode?.color).not.toBe(currentColor)
        nested.each((d) => {
          if (d.dim === 'region') {
            d.setColor(
              [
                'red',
                'green',
              ],
              { mode: 'q', }
            )
          }
        })
        expect(nested.descendants()?.map(d => pick(
          d,
          [
            'id',
            'value',
            'color',
          ]
        ))).toMatchFileSnapshot('./outputs/colors_with_value.json')
      }
    )
    test(
      'idPath test',
      () => {
        expect(nested.leaves()?.[0]?.idPath).toStrictEqual([
          'Missouri',
          'Bachelor\'s Degree',
          'South',
        ])
      }
    )
    test(
      'dimPath test',
      () => {
        expect(nested.leaves()?.[0]?.dimPath).toStrictEqual([
          'state',
          'education_level',
          'region',
        ])
      }
    )
    test(
      'descendantsAt test',
      () => {
        expect(nested.descendantsAt({ dim: 'state', })).toMatchFileSnapshot('./outputs/descendantsAt state.json')
      }
    )
    describe(
      'lookup tests',
      () => {
        const lookupObject = {
          crime_rate: 998.33,
          education_level: 'Bachelor\'s Degree',
          ethnicity: 'Two or More Races',
          median_age: 16,
          median_income: 15379,
          population: 6909596,
          poverty_rate: 79.28,
          region: 'South',
          state: 'Missouri',
          unemployment_rate: 43.28,
        }
        const exactArray = nested.lookup(
          at(
            lookupObject,
            [
              'education_level',
              'region',
            ]
          ),
          true
        )
        const exactObject = nested.lookup(
          [ 'South', ],
          false
        )

        test(
          'search using array',
          () => {
            expect(exactArray?.idPath).toStrictEqual([
              'Bachelor\'s Degree',
              'South',
            ])
          }
        )
        test(
          'search using object',
          () => {
            expect(exactObject?.idPath).toStrictEqual([ 'South', ])
          }
        )
      }
    )
  }
)
describe(
  'node returning methods',
  () => {
    test(
      'structure',
      () => {
        expect(JSON.parse(JSON.stringify(nested))).toMatchFileSnapshot('./outputs/hierarchy.json')
        nested.setValues(arr => sumBy(
          arr,
          'population'
        ))
        expect(JSON.parse(JSON.stringify(nested))).toMatchFileSnapshot('./outputs/hierarchy_summed.json')
      }
    )

    test(
      'leaves',
      () => {
        expect(nested.leaves(true)).toMatchFileSnapshot('./outputs/leaves.json')
      }
    )
    test(
      'descendants',
      () => {
        expect(nested.descendants().map(d => omit(
          [ 'children', ],
          d
        ))).toMatchFileSnapshot('./outputs/descendants.json')
      }
    )
    test(
      'links',
      () => {
        expect(nested.links(true).map(({
          source, target,
        }) => ({
          source: source.id,
          target: target.id,
        }))).toMatchFileSnapshot('./outputs/links.json')
      }
    )
    test(
      'ancestors',
      () => {
        expect(nested.leaves()[0].ancestors().map(d => omit(
          [
            'children',
            'data',
            'records',
          ],
          d
        ))).toMatchInlineSnapshot(`
          [
            {
              "depth": 4,
              "dimPath": [
                "state",
                "education_level",
                "region",
              ],
              "height": 0,
              "idPath": [
                "Missouri",
                "Bachelor's Degree",
                "South",
              ],
              "value": 13819192,
            },
            {
              "depth": 3,
              "dim": "state",
              "dimPath": [
                "state",
                "education_level",
                "region",
              ],
              "height": 1,
              "id": "Missouri",
              "idPath": [
                "Missouri",
                "Bachelor's Degree",
                "South",
              ],
              "value": 13819192,
            },
            {
              "depth": 2,
              "dim": "education_level",
              "dimPath": [
                "education_level",
                "region",
              ],
              "height": 2,
              "id": "Bachelor's Degree",
              "idPath": [
                "Bachelor's Degree",
                "South",
              ],
              "value": 13819192,
            },
            {
              "color": "#bf2000",
              "colorScale": [
                "red",
                "green",
              ],
              "colorScaleBy": "parentListOnly",
              "colorScaleMode": "q",
              "colorScaleNum": 5,
              "depth": 1,
              "dim": "region",
              "dimPath": [
                "region",
              ],
              "height": 3,
              "id": "South",
              "idPath": [
                "South",
              ],
              "value": 39343770,
            },
            {
              "depth": 0,
              "dimPath": [],
              "height": 4,
              "idPath": [],
              "value": 285064032,
            },
          ]
        `)
      }
    )
    test(
      'records',
      () => {
        expect(safelyYaml(nested.records)).toMatchFileSnapshot('./outputs/records.yaml')
      }
    )
    test(
      'path',
      () => {
        const leafNodes = nested.leaves()
        const pathArray = leafNodes[0].path(
          leafNodes[10],
          true
        ).map(node => omit(
          [
            'children',
            'data',
          ],
          node
        ))

        expect(pathArray).toMatchFileSnapshot('./outputs/path.json')
      }
    )
    test(
      'copy',
      () => {
        expect(nested.children?.[0]?.copy()).toMatchFileSnapshot('./outputs/copy.json')
      }
    )
    test(
      'makePies',
      () => {
        nested.makePies(
          Math.PI,
          Math.PI * 2,
          0.01
        )

        const pieNodes = nested.descendants().map(d => ({
          id: d.id,
          startAngle: d.startAngle,
          endAngle: d.endAngle,
          padAngle: d.padAngle,
          minArcAngle: d.minArcAngle(),
        }))
          .filter(d => typeof d.id !== 'undefined')

        expect(pieNodes).toMatchFileSnapshot('./outputs/pies.json')
      }
    )
  }
)
describe(
  'output records test',
  () => {
    test(
      'records',
      () => {
        const foundNode = nested.find(node => node.id === 'Minnesota')

        expect(omit(
          [
            'data',
            'children',
          ],
          foundNode
        )).toMatchInlineSnapshot(`
          {
            "depth": 3,
            "dim": "state",
            "dimPath": [
              "state",
              "education_level",
              "region",
            ],
            "height": 1,
            "id": "Minnesota",
            "idPath": [
              "Minnesota",
              "Some College",
              "Midwest",
            ],
            "value": 4062940,
          }
        `)
      }
    )
  }
)
function safelyYaml(nested: any): string {
  const safeString = safeStableStringify(nested)

  return yaml.stringify(JSON.parse(safeString ?? ''))
}
