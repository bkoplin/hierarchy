import { readJSONSync, } from 'fs-extra'
import { prop, } from 'rambdax'
import {
  describe, expect, test,
} from 'vitest'
import { hierarchy, } from '../../src/hierarchy/index.ts'

const data = readJSONSync('./test/data/MOCK_DATA.json')

describe(
  'hierarchy test',
  () => {
    const nested = hierarchy(
      data,
      [
        prop('gender'),
        prop('first_name'),
      ],
      [
        'gender',
        'first_name',
      ]
    )

    test(
      'structure',
      () => {
        expect(nested).toMatchFileSnapshot('./outputs/hierarchy.json')
      }
    )

    test(
      'depth',
      () => {
        expect(nested.children?.[0].depth).toBe(1)
      }
    )
    test(
      'dim of first child to equal \'gender\'',
      () => {
        expect(nested.children?.[0].dim).toBe('gender')
      }
    )
    test(
      'id test',
      () => {
        expect(nested.children?.[0]?.children?.[0].id).toMatchInlineSnapshot('"Mignonne"')
      }
    )
    test(
      'color test',
      () => {
        expect(nested.children?.[0]?.children?.[0].color('Spectral')).toMatchInlineSnapshot('undefined')
      }
    )
    test(
      'idPath test',
      () => {
        expect(nested.leaves()?.[0]?.parent?.idPath).toMatchInlineSnapshot(`
          [
            "Dory",
            "Agender",
          ]
        `)
      }
    )
    test(
      'dimPath test',
      () => {
        expect(nested.leaves()?.[0]?.parent?.dimPath).toMatchInlineSnapshot(`
          [
            "first_name",
            "gender",
          ]
        `)
      }
    )
    test(
      'idPath test',
      () => {
        expect(nested.leaves()?.[0]?.parent?.idPath).toMatchInlineSnapshot(`
          [
            "Dory",
            "Agender",
          ]
        `)
      }
    )
    test(
      'leaves',
      () => {
        expect(nested.leaves()).toMatchFileSnapshot('./outputs/leaves.json')
      }
    )
    test(
      'descendants',
      () => {
        expect(nested.descendants()).toMatchFileSnapshot('./outputs/descendants.json')
      }
    )
    test(
      'ancestors',
      () => {
        expect(nested.leaves()[0].ancestors()).toMatchFileSnapshot('./outputs/ancestors.json')
      }
    )
    test(
      'find',
      () => {
        expect(nested.find(d => d.data.first_name === 'Esma')?.parent).toMatchFileSnapshot('./outputs/find.json')
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
