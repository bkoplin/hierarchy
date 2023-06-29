import {
  describe, expect, test,
} from 'vitest'
import group from '../../src/array/group'
import data from '../data/MOCK_DATA.json'

const groupByAge = group(
  data,
  'education_level',
  'state'
)

describe(
  'group',
  () => {
    test(
      'root dim is undefined',
      () => {
        expect(groupByAge.dim).toBeUndefined()
      }
    )
    test(
      'first level child dim is education_level',
      () => {
        expect(groupByAge.children[0].dim).toEqual('education_level')
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
        expect(groupByAge.children[0].children[0].hasChildren()).toBe(false)
        expect(groupByAge.children[0].children[0].children).toBeUndefined()
      }
    )
    test(
      'second level child depth is 2',
      () => {
        expect(groupByAge.children?.[0]?.children?.[0].depth).toBe(2)
      }
    )
    test(
      'inline second level first child',
      () => {
        const c = groupByAge.children[0]

        expect(c).toMatchFileSnapshot('./group-children.json')
      }
    )

    test(
      'each method to assign name',
      () => {
        const newRoot = groupByAge.each(d => ({
          ...d,
          name: d.id,
        }))

        expect(newRoot).toMatchFileSnapshot('./group-each.json')
      }
    )
  }
)
