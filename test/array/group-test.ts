import {
  describe, expect, test,
} from 'vitest'
import {
  map, mean, pipe, prop,
} from 'rambdax'
import group from '../../src/array/group'
import data from '../data/MOCK_DATA.json'

const groupByAge = group(
  data,
  'education_level',
  'state'
)

describe(
  'group function',
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
      'change value function, inline second level first child',
      () => {
        const c = groupByAge.children[0]

        c.setValueFunction(pipe(
          prop('records'),
          map(prop('crime_rate')),
          mean
        ))
        c.setValues()
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

describe(
  'ancestor tests',
  () => {
    test(
      'ancestors of first level child has length of 2',
      () => {
        const ancestors = groupByAge.children[0].ancestors()

        expect(ancestors.length).toBe(2)
      }
    )
    test(
      'ancestorsAt depth of 1 of second level child has dim of \'education_level\'',
      () => {
        const ancestors = groupByAge.children[0].children[0]

        expect(ancestors.ancestorAt({ depth: 1, })?.dim).toBe('education_level')
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
        expect(leaf.depth).toBe(2)
        expect(leaf.hasChildren()).toBe(false)
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
        expect(groupByAge.links().map(({
          source, target,
        }) => ({
          source: source?.id,
          target: target.id,
        }))).toMatchFileSnapshot('./group-links.json')
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

        expect(last.leaves()[0].path(first.leaves()[0]).map(node => node.id)).toMatchFileSnapshot('./group-path.json')
      }
    )
  }
)
