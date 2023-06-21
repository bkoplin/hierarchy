import { prop, } from 'rambdax'
import {
  expect, test,
} from 'vitest'
import { uniq, } from 'lodash-es'
import {
  flatGroup, group, index, indexes, rollup, rollups,
} from '../../src/array/group.js'

import data from '../data/MOCK_DATA.json'

test(
  'group',
  () => {
    const nested = group(
      data,
      d => d.region,
      d => d.crime_rate,
      d => d.crime_rate
    )
    const p = nested.get('test')?.get('test1')
      ?.get('test')
      ?.get('test')

    expect(nested).toMatchInlineSnapshot()
  }
)

test(
  'flatGroup',
  () => {
    const nested = flatGroup(
      data,
      prop('gender'),
      prop('first_name')
    )

    expect(nested).toMatchInlineSnapshot(`
      [
        [
          undefined,
          undefined,
          [
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
            {
              "crime_rate": 774.78,
              "education_level": "High School",
              "ethnicity": "Hispanic or Latino",
              "median_age": 56,
              "median_income": 500661,
              "population": 6844380,
              "poverty_rate": 95.83,
              "region": "Northeast",
              "state": "Louisiana",
              "unemployment_rate": 85.21,
            },
            {
              "crime_rate": 974.77,
              "education_level": "Some College",
              "ethnicity": "Native Hawaiian or Other Pacific Islander",
              "median_age": 71,
              "median_income": 325897,
              "population": 203753,
              "poverty_rate": 45.15,
              "region": "Northeast",
              "state": "Delaware",
              "unemployment_rate": 22.02,
            },
            {
              "crime_rate": 506.81,
              "education_level": "Some College",
              "ethnicity": "White",
              "median_age": 10,
              "median_income": 290897,
              "population": 4865392,
              "poverty_rate": 82.3,
              "region": "West",
              "state": "Wyoming",
              "unemployment_rate": 86.43,
            },
            {
              "crime_rate": 312.77,
              "education_level": "Doctorate Degree",
              "ethnicity": "Native Hawaiian or Other Pacific Islander",
              "median_age": 39,
              "median_income": 633004,
              "population": 7137587,
              "poverty_rate": 12.63,
              "region": "Northeast",
              "state": "Oklahoma",
              "unemployment_rate": 64.42,
            },
            {
              "crime_rate": 718.57,
              "education_level": "Bachelor's Degree",
              "ethnicity": "Asian",
              "median_age": 34,
              "median_income": 243034,
              "population": 3167642,
              "poverty_rate": 97.83,
              "region": "West",
              "state": "Arkansas",
              "unemployment_rate": 42.05,
            },
            {
              "crime_rate": 472.47,
              "education_level": "Bachelor's Degree",
              "ethnicity": "White",
              "median_age": 32,
              "median_income": 380617,
              "population": 9724695,
              "poverty_rate": 30.23,
              "region": "Northeast",
              "state": "Colorado",
              "unemployment_rate": 81.97,
            },
            {
              "crime_rate": 693.4,
              "education_level": "Doctorate Degree",
              "ethnicity": "Asian",
              "median_age": 52,
              "median_income": 51904,
              "population": 5577524,
              "poverty_rate": 5.63,
              "region": "West",
              "state": "Arkansas",
              "unemployment_rate": 61.83,
            },
            {
              "crime_rate": 577.4,
              "education_level": "Bachelor's Degree",
              "ethnicity": "Asian",
              "median_age": 85,
              "median_income": 859673,
              "population": 8699437,
              "poverty_rate": 54.98,
              "region": "Northeast",
              "state": "California",
              "unemployment_rate": 28.84,
            },
            {
              "crime_rate": 989.46,
              "education_level": "High School",
              "ethnicity": "American Indian or Alaska Native",
              "median_age": 77,
              "median_income": 244006,
              "population": 9164766,
              "poverty_rate": 23.36,
              "region": "Northeast",
              "state": "New Jersey",
              "unemployment_rate": 79.45,
            },
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
            {
              "crime_rate": 829.65,
              "education_level": "High School",
              "ethnicity": "Native Hawaiian or Other Pacific Islander",
              "median_age": 58,
              "median_income": 245094,
              "population": 8105564,
              "poverty_rate": 83.1,
              "region": "Northeast",
              "state": "Rhode Island",
              "unemployment_rate": 1.14,
            },
            {
              "crime_rate": 871.71,
              "education_level": "Master's Degree",
              "ethnicity": "White",
              "median_age": 21,
              "median_income": 189775,
              "population": 9502876,
              "poverty_rate": 7.54,
              "region": "West",
              "state": "Hawaii",
              "unemployment_rate": 41.79,
            },
            {
              "crime_rate": 981.11,
              "education_level": "Doctorate Degree",
              "ethnicity": "White",
              "median_age": 42,
              "median_income": 519850,
              "population": 6665701,
              "poverty_rate": 66.26,
              "region": "Northeast",
              "state": "Pennsylvania",
              "unemployment_rate": 88.16,
            },
            {
              "crime_rate": 514.82,
              "education_level": "Associate's Degree",
              "ethnicity": "Native Hawaiian or Other Pacific Islander",
              "median_age": 38,
              "median_income": 647118,
              "population": 9513805,
              "poverty_rate": 74.32,
              "region": "Midwest",
              "state": "Wisconsin",
              "unemployment_rate": 37.03,
            },
            {
              "crime_rate": 922.47,
              "education_level": "Doctorate Degree",
              "ethnicity": "Asian",
              "median_age": 27,
              "median_income": 147731,
              "population": 939695,
              "poverty_rate": 24.99,
              "region": "South",
              "state": "Massachusetts",
              "unemployment_rate": 54.88,
            },
            {
              "crime_rate": 356.88,
              "education_level": "Associate's Degree",
              "ethnicity": "Two or More Races",
              "median_age": 84,
              "median_income": 268965,
              "population": 688818,
              "poverty_rate": 38.73,
              "region": "West",
              "state": "Oregon",
              "unemployment_rate": 35.29,
            },
            {
              "crime_rate": 715.31,
              "education_level": "Bachelor's Degree",
              "ethnicity": "Black or African American",
              "median_age": 47,
              "median_income": 827929,
              "population": 38434,
              "poverty_rate": 68.91,
              "region": "Midwest",
              "state": "New Hampshire",
              "unemployment_rate": 20.11,
            },
            {
              "crime_rate": 15.13,
              "education_level": "High School",
              "ethnicity": "Native Hawaiian or Other Pacific Islander",
              "median_age": 5,
              "median_income": 471292,
              "population": 5383096,
              "poverty_rate": 0.66,
              "region": "South",
              "state": "Tennessee",
              "unemployment_rate": 20.9,
            },
            {
              "crime_rate": 421.59,
              "education_level": "Associate's Degree",
              "ethnicity": "American Indian or Alaska Native",
              "median_age": 86,
              "median_income": 646092,
              "population": 6898905,
              "poverty_rate": 75.32,
              "region": "Midwest",
              "state": "Idaho",
              "unemployment_rate": 85.54,
            },
            {
              "crime_rate": 580.89,
              "education_level": "Associate's Degree",
              "ethnicity": "American Indian or Alaska Native",
              "median_age": 56,
              "median_income": 779975,
              "population": 6121317,
              "poverty_rate": 78.96,
              "region": "Northeast",
              "state": "Illinois",
              "unemployment_rate": 53.77,
            },
            {
              "crime_rate": 62.68,
              "education_level": "Some College",
              "ethnicity": "White",
              "median_age": 74,
              "median_income": 524056,
              "population": 1006842,
              "poverty_rate": 71.71,
              "region": "West",
              "state": "Utah",
              "unemployment_rate": 40.89,
            },
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
            {
              "crime_rate": 697.82,
              "education_level": "Master's Degree",
              "ethnicity": "Two or More Races",
              "median_age": 65,
              "median_income": 983716,
              "population": 3191576,
              "poverty_rate": 80.65,
              "region": "South",
              "state": "New Mexico",
              "unemployment_rate": 19.34,
            },
            {
              "crime_rate": 601.82,
              "education_level": "Master's Degree",
              "ethnicity": "Hispanic or Latino",
              "median_age": 68,
              "median_income": 588072,
              "population": 787771,
              "poverty_rate": 85.75,
              "region": "Northeast",
              "state": "Arizona",
              "unemployment_rate": 40.55,
            },
            {
              "crime_rate": 982.58,
              "education_level": "High School",
              "ethnicity": "Native Hawaiian or Other Pacific Islander",
              "median_age": 0,
              "median_income": 1227,
              "population": 6305889,
              "poverty_rate": 99.67,
              "region": "Northeast",
              "state": "Pennsylvania",
              "unemployment_rate": 62.07,
            },
            {
              "crime_rate": 677.97,
              "education_level": "Associate's Degree",
              "ethnicity": "Native Hawaiian or Other Pacific Islander",
              "median_age": 68,
              "median_income": 739550,
              "population": 3247922,
              "poverty_rate": 69.02,
              "region": "South",
              "state": "New Mexico",
              "unemployment_rate": 75.17,
            },
          ],
        ],
      ]
    `)
  }
)
test(
  'index',
  () => {
    const nested = index(
      data,
      prop('gender')
    )

    expect(nested).toMatchInlineSnapshot(`
      Map {
        undefined => {
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
      }
    `)
  }
)
test(
  'indexes',
  () => {
    const nested = indexes(
      data,
      prop('gender')
    )

    expect(nested).toMatchInlineSnapshot(`
      [
        [
          undefined,
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
      ]
    `)
  }
)
test(
  'rollup',
  () => {
    const nested = rollup(
      data,
      v => uniq(v).length,
      prop('gender')
    )

    expect(nested).toMatchInlineSnapshot(`
      Map {
        undefined => 27,
      }
    `)
  }
)
test(
  'rollups',
  () => {
    const nested = rollups(
      data,
      v => uniq(v).length,
      prop('gender'),
      d => d.first_name?.[0]
    )

    expect(nested).toMatchInlineSnapshot(`
      [
        [
          undefined,
          [
            [
              undefined,
              27,
            ],
          ],
        ],
      ]
    `)
  }
)
