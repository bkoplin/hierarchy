import {
  describe, expect, test,
} from 'vitest'
import yaml from 'yaml'
import safeStableStringify from 'safe-stable-stringify'

import {
  at, pick, sumBy,
} from 'lodash-es'
import { omit, } from 'rambdax'
import type { IterableElement, } from 'type-fest'

import { hierarchy, } from '../../src/hierarchy/index'

import data from '../data/MOCK_DATA.json'
import { group, } from '../../src/array/group'

type D = IterableElement<typeof data>

const grouped = group(
  data,
  d => d.region,
  d => d.education_level,
  d => d.state
)
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
    const leafDepth = nested.leaves()?.[0].depth

    test(
      'depth',
      () => expect(leafDepth).toBe(4)
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
        nested.makePies(
          Math.PI,
          Math.PI * 2,
          0.01
        )
        const foundNode = nested.find(node => node.id === 'Some College')

        expect(foundNode).toMatchInlineSnapshot(`
          {
            "children": [
              {
                "children": [
                  {
                    "children": undefined,
                    "data": {
                      "crime_rate": 568.42,
                      "education_level": "Some College",
                      "ethnicity": "Black or African American",
                      "median_age": 24,
                      "median_income": 376235,
                      "population": 9807563,
                      "poverty_rate": 85.17,
                      "region": "Midwest",
                      "state": "Maryland",
                      "unemployment_rate": 34.94,
                    },
                    "depth": 4,
                    "dim": undefined,
                    "dimIndexOf": -1,
                    "dimPath": [
                      "state",
                      "education_level",
                      "region",
                    ],
                    "endAngle": {
                      "degrees": 210.7727664854194,
                      "radians": 5.249475075502621,
                    },
                    "height": 0,
                    "id": undefined,
                    "idPath": [
                      "Maryland",
                      "Some College",
                      "Midwest",
                    ],
                    "indexOf": 0,
                    "minArcAngle": {
                      "degrees": 12.426649506736757,
                      "radians": 0.21688594888388568,
                    },
                    "padAngle": {
                      "degrees": 0,
                      "radians": 0,
                    },
                    "startAngle": {
                      "degrees": 198.3461169786826,
                      "radians": 5.032589126618736,
                    },
                    "value": 19615126,
                    Symbol(Symbol.iterator): [Function],
                  },
                ],
                "data": [
                  "Maryland",
                  [
                    {
                      "crime_rate": 568.42,
                      "education_level": "Some College",
                      "ethnicity": "Black or African American",
                      "median_age": 24,
                      "median_income": 376235,
                      "population": 9807563,
                      "poverty_rate": 85.17,
                      "region": "Midwest",
                      "state": "Maryland",
                      "unemployment_rate": 34.94,
                    },
                  ],
                ],
                "depth": 3,
                "dim": "state",
                "dimIndexOf": 2,
                "dimPath": [
                  "state",
                  "education_level",
                  "region",
                ],
                "endAngle": {
                  "degrees": 210.7727664854194,
                  "radians": 5.249475075502621,
                },
                "height": 1,
                "id": "Maryland",
                "idPath": [
                  "Maryland",
                  "Some College",
                  "Midwest",
                ],
                "indexOf": 0,
                "minArcAngle": {
                  "degrees": 2.5739692595857155,
                  "radians": 0.04492423842489135,
                },
                "padAngle": {
                  "degrees": 0,
                  "radians": 0,
                },
                "startAngle": {
                  "degrees": 198.3461169786826,
                  "radians": 5.032589126618736,
                },
                "value": 19615126,
                Symbol(Symbol.iterator): [Function],
              },
              {
                "children": [
                  {
                    "children": undefined,
                    "data": {
                      "crime_rate": 784.69,
                      "education_level": "Some College",
                      "ethnicity": "Asian",
                      "median_age": 90,
                      "median_income": 738982,
                      "population": 2031470,
                      "poverty_rate": 20.42,
                      "region": "Midwest",
                      "state": "Minnesota",
                      "unemployment_rate": 48.93,
                    },
                    "depth": 4,
                    "dim": undefined,
                    "dimIndexOf": -1,
                    "dimPath": [
                      "state",
                      "education_level",
                      "region",
                    ],
                    "endAngle": {
                      "degrees": 213.3467357450051,
                      "radians": 5.294399313927513,
                    },
                    "height": 0,
                    "id": undefined,
                    "idPath": [
                      "Minnesota",
                      "Some College",
                      "Midwest",
                    ],
                    "indexOf": 0,
                    "minArcAngle": {
                      "degrees": 2.5739692595857155,
                      "radians": 0.04492423842489135,
                    },
                    "padAngle": {
                      "degrees": 0,
                      "radians": 0,
                    },
                    "startAngle": {
                      "degrees": 210.7727664854194,
                      "radians": 5.249475075502621,
                    },
                    "value": 4062940,
                    Symbol(Symbol.iterator): [Function],
                  },
                ],
                "data": [
                  "Minnesota",
                  [
                    {
                      "crime_rate": 784.69,
                      "education_level": "Some College",
                      "ethnicity": "Asian",
                      "median_age": 90,
                      "median_income": 738982,
                      "population": 2031470,
                      "poverty_rate": 20.42,
                      "region": "Midwest",
                      "state": "Minnesota",
                      "unemployment_rate": 48.93,
                    },
                  ],
                ],
                "depth": 3,
                "dim": "state",
                "dimIndexOf": 2,
                "dimPath": [
                  "state",
                  "education_level",
                  "region",
                ],
                "endAngle": {
                  "degrees": 213.3467357450051,
                  "radians": 5.294399313927513,
                },
                "height": 1,
                "id": "Minnesota",
                "idPath": [
                  "Minnesota",
                  "Some College",
                  "Midwest",
                ],
                "indexOf": 1,
                "minArcAngle": {
                  "degrees": 2.5739692595857155,
                  "radians": 0.04492423842489135,
                },
                "padAngle": {
                  "degrees": 0,
                  "radians": 0,
                },
                "startAngle": {
                  "degrees": 210.7727664854194,
                  "radians": 5.249475075502621,
                },
                "value": 4062940,
                Symbol(Symbol.iterator): [Function],
              },
            ],
            "data": [
              "Some College",
              Map {
                "Minnesota" => [
                  {
                    "crime_rate": 784.69,
                    "education_level": "Some College",
                    "ethnicity": "Asian",
                    "median_age": 90,
                    "median_income": 738982,
                    "population": 2031470,
                    "poverty_rate": 20.42,
                    "region": "Midwest",
                    "state": "Minnesota",
                    "unemployment_rate": 48.93,
                  },
                ],
                "Maryland" => [
                  {
                    "crime_rate": 568.42,
                    "education_level": "Some College",
                    "ethnicity": "Black or African American",
                    "median_age": 24,
                    "median_income": 376235,
                    "population": 9807563,
                    "poverty_rate": 85.17,
                    "region": "Midwest",
                    "state": "Maryland",
                    "unemployment_rate": 34.94,
                  },
                ],
              },
            ],
            "depth": 2,
            "dim": "education_level",
            "dimIndexOf": 1,
            "dimPath": [
              "education_level",
              "region",
            ],
            "endAngle": {
              "degrees": 213.3467357450051,
              "radians": 5.294399313927513,
            },
            "height": 2,
            "id": "Some College",
            "idPath": [
              "Some College",
              "Midwest",
            ],
            "indexOf": 2,
            "minArcAngle": {
              "degrees": 0.048697708813286576,
              "radians": 0.0008499353569693113,
            },
            "padAngle": {
              "degrees": 0,
              "radians": 0,
            },
            "startAngle": {
              "degrees": 198.3461169786826,
              "radians": 5.032589126618736,
            },
            "value": 23678066,
            Symbol(Symbol.iterator): [Function],
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
