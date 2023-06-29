import data from './MOCK_DATA.json'
import group from './group'

const groupByAge = group(
  data,
  d => d.state
)

describe(
  'group',
  () => {
    test(
      'should group by age',
      () => {
        expect(groupByAge).toMatchInlineSnapshot()
      }
    )
  }
)
