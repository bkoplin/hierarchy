import { readJSONSync, } from 'fs-extra'
import { prop, } from 'rambdax'
import {
  expect, test,
} from 'vitest'
import {
  flatGroup, index, indexes, rollup, rollups,
} from '../../src/array/group.ts'
import { uniq } from 'lodash-es'

const data = readJSONSync('./test/data/MOCK_DATA.json')

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
          "Genderfluid",
          "Mignonne",
          [
            {
              "email": "mpolino0@tumblr.com",
              "first_name": "Mignonne",
              "gender": "Genderfluid",
              "id": 1,
              "ip_address": "85.52.133.84",
              "last_name": "Polino",
            },
          ],
        ],
        [
          "Male",
          "Rowen",
          [
            {
              "email": "rkitman1@sourceforge.net",
              "first_name": "Rowen",
              "gender": "Male",
              "id": 2,
              "ip_address": "119.227.240.5",
              "last_name": "Kitman",
            },
          ],
        ],
        [
          "Male",
          "Curtis",
          [
            {
              "email": "colczak3@joomla.org",
              "first_name": "Curtis",
              "gender": "Male",
              "id": 4,
              "ip_address": "138.111.28.30",
              "last_name": "Olczak",
            },
          ],
        ],
        [
          "Male",
          "Jarred",
          [
            {
              "email": "jwesley8@icq.com",
              "first_name": "Jarred",
              "gender": "Male",
              "id": 9,
              "ip_address": "203.130.46.4",
              "last_name": "Wesley",
            },
          ],
        ],
        [
          "Male",
          "Stephan",
          [
            {
              "email": "sbroodb@ucoz.com",
              "first_name": "Stephan",
              "gender": "Male",
              "id": 12,
              "ip_address": "127.109.20.89",
              "last_name": "Brood",
            },
          ],
        ],
        [
          "Male",
          "Baldwin",
          [
            {
              "email": "bbillesc@sun.com",
              "first_name": "Baldwin",
              "gender": "Male",
              "id": 13,
              "ip_address": "196.212.1.30",
              "last_name": "Billes",
            },
          ],
        ],
        [
          "Male",
          "Felix",
          [
            {
              "email": "fturneyd@amazon.de",
              "first_name": "Felix",
              "gender": "Male",
              "id": 14,
              "ip_address": "157.72.75.90",
              "last_name": "Turney",
            },
          ],
        ],
        [
          "Male",
          "Isidor",
          [
            {
              "email": "isalzeng@cam.ac.uk",
              "first_name": "Isidor",
              "gender": "Male",
              "id": 17,
              "ip_address": "111.11.94.137",
              "last_name": "Salzen",
            },
          ],
        ],
        [
          "Male",
          "Brennen",
          [
            {
              "email": "bskeal@java.com",
              "first_name": "Brennen",
              "gender": "Male",
              "id": 22,
              "ip_address": "165.135.113.243",
              "last_name": "Skea",
            },
          ],
        ],
        [
          "Male",
          "Conrado",
          [
            {
              "email": "cassonm@bing.com",
              "first_name": "Conrado",
              "gender": "Male",
              "id": 23,
              "ip_address": "11.31.201.124",
              "last_name": "Asson",
            },
          ],
        ],
        [
          "Female",
          "Helaina",
          [
            {
              "email": "hdelhay2@live.com",
              "first_name": "Helaina",
              "gender": "Female",
              "id": 3,
              "ip_address": "23.204.20.9",
              "last_name": "Delhay",
            },
          ],
        ],
        [
          "Female",
          "Allegra",
          [
            {
              "email": "afilgate4@yelp.com",
              "first_name": "Allegra",
              "gender": "Female",
              "id": 5,
              "ip_address": "247.118.240.26",
              "last_name": "Filgate",
            },
          ],
        ],
        [
          "Female",
          "Jobie",
          [
            {
              "email": "jtuite6@gizmodo.com",
              "first_name": "Jobie",
              "gender": "Female",
              "id": 7,
              "ip_address": "202.152.24.89",
              "last_name": "Tuite",
            },
          ],
        ],
        [
          "Female",
          "Malanie",
          [
            {
              "email": "mberthel7@hhs.gov",
              "first_name": "Malanie",
              "gender": "Female",
              "id": 8,
              "ip_address": "53.10.120.174",
              "last_name": "Berthel",
            },
          ],
        ],
        [
          "Female",
          "Wendie",
          [
            {
              "email": "wbetty9@mapy.cz",
              "first_name": "Wendie",
              "gender": "Female",
              "id": 10,
              "ip_address": "19.252.58.176",
              "last_name": "Betty",
            },
          ],
        ],
        [
          "Female",
          "Aurelia",
          [
            {
              "email": "agaffeya@nytimes.com",
              "first_name": "Aurelia",
              "gender": "Female",
              "id": 11,
              "ip_address": "65.175.111.185",
              "last_name": "Gaffey",
            },
          ],
        ],
        [
          "Female",
          "Tildi",
          [
            {
              "email": "tbernhardte@aboutads.info",
              "first_name": "Tildi",
              "gender": "Female",
              "id": 15,
              "ip_address": "22.252.162.162",
              "last_name": "Bernhardt",
            },
          ],
        ],
        [
          "Female",
          "Noemi",
          [
            {
              "email": "nhelkinf@skype.com",
              "first_name": "Noemi",
              "gender": "Female",
              "id": 16,
              "ip_address": "47.154.232.38",
              "last_name": "Helkin",
            },
          ],
        ],
        [
          "Female",
          "Alexis",
          [
            {
              "email": "avansaltsbergi@gnu.org",
              "first_name": "Alexis",
              "gender": "Female",
              "id": 19,
              "ip_address": "56.113.250.88",
              "last_name": "Van Saltsberg",
            },
          ],
        ],
        [
          "Female",
          "Martha",
          [
            {
              "email": "mroderighij@ucla.edu",
              "first_name": "Martha",
              "gender": "Female",
              "id": 20,
              "ip_address": "239.136.159.254",
              "last_name": "Roderighi",
            },
          ],
        ],
        [
          "Female",
          "Cornie",
          [
            {
              "email": "cmohringk@ameblo.jp",
              "first_name": "Cornie",
              "gender": "Female",
              "id": 21,
              "ip_address": "238.23.57.111",
              "last_name": "Mohring",
            },
          ],
        ],
        [
          "Female",
          "Esma",
          [
            {
              "email": "egormann@sciencedaily.com",
              "first_name": "Esma",
              "gender": "Female",
              "id": 24,
              "ip_address": "133.61.161.149",
              "last_name": "Gorman",
            },
          ],
        ],
        [
          "Genderqueer",
          "Mikaela",
          [
            {
              "email": "mpettegre5@people.com.cn",
              "first_name": "Mikaela",
              "gender": "Genderqueer",
              "id": 6,
              "ip_address": "42.189.102.176",
              "last_name": "Pettegre",
            },
          ],
        ],
        [
          "Agender",
          "Dory",
          [
            {
              "email": "dogavinh@istockphoto.com",
              "first_name": "Dory",
              "gender": "Agender",
              "id": 18,
              "ip_address": "133.187.214.85",
              "last_name": "O'Gavin",
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
        "Male" => {
          "email": "rkitman1@sourceforge.net",
          "first_name": "Rowen",
          "gender": "Male",
          "id": 2,
          "ip_address": "119.227.240.5",
          "last_name": "Kitman",
        },
        "Female" => {
          "email": "hdelhay2@live.com",
          "first_name": "Helaina",
          "gender": "Female",
          "id": 3,
          "ip_address": "23.204.20.9",
          "last_name": "Delhay",
        },
        "Genderqueer" => {
          "email": "mpettegre5@people.com.cn",
          "first_name": "Mikaela",
          "gender": "Genderqueer",
          "id": 6,
          "ip_address": "42.189.102.176",
          "last_name": "Pettegre",
        },
        "Agender" => {
          "email": "dogavinh@istockphoto.com",
          "first_name": "Dory",
          "gender": "Agender",
          "id": 18,
          "ip_address": "133.187.214.85",
          "last_name": "O'Gavin",
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
          "Female",
          {
            "email": "hdelhay2@live.com",
            "first_name": "Helaina",
            "gender": "Female",
            "id": 3,
            "ip_address": "23.204.20.9",
            "last_name": "Delhay",
          },
        ],
        [
          "Male",
          {
            "email": "colczak3@joomla.org",
            "first_name": "Curtis",
            "gender": "Male",
            "id": 4,
            "ip_address": "138.111.28.30",
            "last_name": "Olczak",
          },
        ],
        [
          "Genderqueer",
          {
            "email": "mpettegre5@people.com.cn",
            "first_name": "Mikaela",
            "gender": "Genderqueer",
            "id": 6,
            "ip_address": "42.189.102.176",
            "last_name": "Pettegre",
          },
        ],
        [
          "Agender",
          {
            "email": "dogavinh@istockphoto.com",
            "first_name": "Dory",
            "gender": "Agender",
            "id": 18,
            "ip_address": "133.187.214.85",
            "last_name": "O'Gavin",
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
        "Male" => 8,
        "Female" => 11,
        "Genderqueer" => 1,
        "Agender" => 1,
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
      (d) => d.first_name?.[0]
    )

    expect(nested).toMatchInlineSnapshot(`
      [
        [
          "Female",
          [
            [
              "A",
              3,
            ],
            [
              "J",
              1,
            ],
            [
              "M",
              2,
            ],
            [
              "W",
              1,
            ],
            [
              "T",
              1,
            ],
            [
              "N",
              1,
            ],
            [
              "C",
              1,
            ],
            [
              "E",
              1,
            ],
          ],
        ],
        [
          "Genderqueer",
          [
            [
              "M",
              1,
            ],
          ],
        ],
        [
          "Male",
          [
            [
              "J",
              1,
            ],
            [
              "S",
              1,
            ],
            [
              "B",
              2,
            ],
            [
              "F",
              1,
            ],
            [
              "I",
              1,
            ],
            [
              "C",
              1,
            ],
          ],
        ],
        [
          "Agender",
          [
            [
              "D",
              1,
            ],
          ],
        ],
      ]
    `)
  }
)
