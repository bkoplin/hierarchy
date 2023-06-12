import {
  describe, expect, test,
} from 'vitest'
import yaml from 'yaml'
import safeStableStringify from 'safe-stable-stringify'

import {
  at, omit,
} from 'lodash-es'
import { hierarchy, } from '../../src/hierarchy/index'

import data from '../data/MOCK_DATA.json'

describe(
  'hierarchy test',
  () => {
    const nested = hierarchy(
      data,
      'region',
      'education_level',
      'state'
    )

    describe(
      'depth and height',
      () => {
        test(
          'depth',
          () => expect(nested.leaves()?.[0].depth).toMatchInlineSnapshot('4')
        )
        test(
          'height',
          () => expect(nested.height).toMatchInlineSnapshot('4')
        )
      }
    )
    describe(
      'dim, ID and paths',
      () => {
        test(
          'dim of first child to equal \'state\'',
          () => {
            expect(nested.children?.[0].dim).toMatchInlineSnapshot('"region"')
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
            expect(nested.leaves()?.map(d => [
              d.id,
              d.color('Paired'),
            ])).toMatchFileSnapshot('./outputs/colors.json')
          }
        )
        test(
          'idPath test',
          () => {
            expect(nested.leaves()?.[0]?.idPath).toMatchInlineSnapshot(`
              [
                "New Hampshire",
                "Bachelor's Degree",
                "Midwest",
              ]
            `)
          }
        )
        test(
          'dimPath test',
          () => {
            expect(nested.leaves()?.[0]?.dimPath).toMatchInlineSnapshot(`
              [
                "state",
                "education_level",
                "region",
              ]
            `)
          }
        )
        test(
          'descendantsAt test',
          () => {
            expect(safelyYaml(nested.descendantsAt('state'))).toMatchFileSnapshot('./outputs/descendantsAt state.json')
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
                expect(exactArray?.idPath).toMatchInlineSnapshot(`
                  [
                    "Bachelor's Degree",
                    "South",
                  ]
                `)
              }
            )
            test(
              'search using object',
              () => {
                expect(exactObject?.idPath).toMatchInlineSnapshot(`
                  [
                    "South",
                  ]
                `)
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
            expect(JSON.parse(safeStableStringify(nested))).toMatchFileSnapshot('./outputs/hierarchy.json')
          }
        )

        test(
          'leaves',
          () => {
            expect(safelyYaml(nested.leaves())).toMatchFileSnapshot('./outputs/leaves.yaml')
          }
        )
        test(
          'descendants',
          () => {
            expect(safelyYaml(nested.descendants().map(d => omit(
              d,
              'children'
            )))).toMatchFileSnapshot('./outputs/descendants.yaml')
          }
        )
        test(
          'ancestors',
          () => {
            expect(safelyYaml(nested.leaves()[0].ancestors().map(d => d.data))).toMatchFileSnapshot('./outputs/ancestors.yaml')
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
            expect(JSON.parse(safeStableStringify(nested.leaves()[0].path(nested.leaves()[10])))).toMatchFileSnapshot('./outputs/path.json')
          }
        )
        test(
          'copy',
          () => {
            expect(JSON.parse(safeStableStringify(nested.leaves()[0].parent?.copy()))).toMatchFileSnapshot('./outputs/copy.json')
          }
        )
        test(
          'export',
          () => {
            expect(nested.leaves()[0].parent?.exportJSON()).toMatchFileSnapshot('./outputs/exportJSON.json')
          }
        )
      }
    )
    test(
      'records',
      () => {
        expect(nested.records).toMatchFileSnapshot('./outputs/records.json')
      }
    )
  }
)
function safelyYaml(nested: any): string {
  const safeString = safeStableStringify(nested)

  return yaml.stringify(JSON.parse(safeString ?? ''))
}
