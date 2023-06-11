import {
  describe, expect, test,
} from 'vitest'
import yaml from 'yaml'
import safeStableStringify from 'safe-stable-stringify'

import { omit, } from 'lodash-es'
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

    test(
      'structure',
      () => {
        expect(nested).toMatchFileSnapshot('./outputs/hierarchy.json')
      }
    )

    describe(
      'depth and height',
      () => {
        test(
          'depth',
          () => expect(nested.children?.[0].depth).toBe(1)
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
            expect(nested.children?.[0].dim).toMatchInlineSnapshot('"region"')
          }
        )
        test(
          'id test',
          () => {
            expect(nested.children?.[0].id).toMatchInlineSnapshot('"South"')
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
                "Missouri",
                "Bachelor's Degree",
                "South",
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
      }
    )
    describe(
      'node returning methods',
      () => {
        test(
          'leaves',
          () => {
            expect(safelyYaml(nested.leaves().slice(
              0,
              2
            ))).toMatchFileSnapshot('./outputs/leaves.yaml')
          }
        )
        test(
          'descendants',
          () => {
            expect(safelyYaml(nested.descendants().map(d => d.data))).toMatchFileSnapshot('./outputs/descendants.yaml')
          }
        )
        test(
          'ancestors',
          () => {
            expect(safelyYaml(nested.leaves()[0].ancestors().map(d => d.data))).toMatchFileSnapshot('./outputs/ancestors.yaml')
          }
        )
        test(
          'find',
          () => {
            expect(nested.find(d => d.id === 'South')).toMatchFileSnapshot('./outputs/find.json')
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
