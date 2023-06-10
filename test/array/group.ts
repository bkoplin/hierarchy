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
          "Genderfluid",
          "Joane",
          [
            {
              "email": "jcrookstonq@blogs.com",
              "first_name": "Joane",
              "gender": "Genderfluid",
              "id": 27,
              "ip_address": "105.4.120.75",
              "last_name": "Crookston",
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
          "Male",
          "Eal",
          [
            {
              "email": "eandrollip@census.gov",
              "first_name": "Eal",
              "gender": "Male",
              "id": 26,
              "ip_address": "36.158.13.108",
              "last_name": "Androlli",
            },
          ],
        ],
        [
          "Male",
          "Reade",
          [
            {
              "email": "rrawoodr@wikispaces.com",
              "first_name": "Reade",
              "gender": "Male",
              "id": 28,
              "ip_address": "0.254.249.123",
              "last_name": "Rawood",
            },
          ],
        ],
        [
          "Male",
          "Anthony",
          [
            {
              "email": "atocks@naver.com",
              "first_name": "Anthony",
              "gender": "Male",
              "id": 29,
              "ip_address": "12.215.11.126",
              "last_name": "Tock",
            },
          ],
        ],
        [
          "Male",
          "Jessie",
          [
            {
              "email": "jelmaru@si.edu",
              "first_name": "Jessie",
              "gender": "Male",
              "id": 31,
              "ip_address": "3.108.196.235",
              "last_name": "Elmar",
            },
          ],
        ],
        [
          "Male",
          "Dieter",
          [
            {
              "email": "dgahanw@bravesites.com",
              "first_name": "Dieter",
              "gender": "Male",
              "id": 33,
              "ip_address": "21.238.80.220",
              "last_name": "Gahan",
            },
          ],
        ],
        [
          "Male",
          "Julio",
          [
            {
              "email": "jfranceschinox@nytimes.com",
              "first_name": "Julio",
              "gender": "Male",
              "id": 34,
              "ip_address": "60.35.162.249",
              "last_name": "Franceschino",
            },
          ],
        ],
        [
          "Male",
          "Eduardo",
          [
            {
              "email": "efreemantley@newsvine.com",
              "first_name": "Eduardo",
              "gender": "Male",
              "id": 35,
              "ip_address": "156.194.53.174",
              "last_name": "Freemantle",
            },
          ],
        ],
        [
          "Male",
          "Daryl",
          [
            {
              "email": "dosgarby10@sitemeter.com",
              "first_name": "Daryl",
              "gender": "Male",
              "id": 37,
              "ip_address": "78.177.220.52",
              "last_name": "Osgarby",
            },
          ],
        ],
        [
          "Male",
          "Samson",
          [
            {
              "email": "sfawkes13@craigslist.org",
              "first_name": "Samson",
              "gender": "Male",
              "id": 40,
              "ip_address": "173.177.191.66",
              "last_name": "Fawkes",
            },
          ],
        ],
        [
          "Male",
          "Lou",
          [
            {
              "email": "lorpin15@dmoz.org",
              "first_name": "Lou",
              "gender": "Male",
              "id": 42,
              "ip_address": "141.182.62.101",
              "last_name": "Orpin",
            },
          ],
        ],
        [
          "Male",
          "Zed",
          [
            {
              "email": "zjehaes18@nyu.edu",
              "first_name": "Zed",
              "gender": "Male",
              "id": 45,
              "ip_address": "52.185.37.2",
              "last_name": "Jehaes",
            },
          ],
        ],
        [
          "Male",
          "Ashbey",
          [
            {
              "email": "agiovannacci1c@mit.edu",
              "first_name": "Ashbey",
              "gender": "Male",
              "id": 49,
              "ip_address": "63.229.8.196",
              "last_name": "Giovannacc@i",
            },
          ],
        ],
        [
          "Male",
          "Fabian",
          [
            {
              "email": "fmansour1e@engadget.com",
              "first_name": "Fabian",
              "gender": "Male",
              "id": 51,
              "ip_address": "8.1.58.130",
              "last_name": "Mansour",
            },
          ],
        ],
        [
          "Male",
          "Reider",
          [
            {
              "email": "rlitherborough1f@fema.gov",
              "first_name": "Reider",
              "gender": "Male",
              "id": 52,
              "ip_address": "94.111.135.24",
              "last_name": "Litherborough",
            },
          ],
        ],
        [
          "Male",
          "Buckie",
          [
            {
              "email": "bokeeffe1n@sourceforge.net",
              "first_name": "Buckie",
              "gender": "Male",
              "id": 60,
              "ip_address": "225.106.83.131",
              "last_name": "O'Keeffe",
            },
          ],
        ],
        [
          "Male",
          "Rock",
          [
            {
              "email": "rperillo1p@wix.com",
              "first_name": "Rock",
              "gender": "Male",
              "id": 62,
              "ip_address": "51.31.81.177",
              "last_name": "Perillo",
            },
          ],
        ],
        [
          "Male",
          "Cordy",
          [
            {
              "email": "ckirwood1r@wunderground.com",
              "first_name": "Cordy",
              "gender": "Male",
              "id": 64,
              "ip_address": "227.234.38.226",
              "last_name": "Kirwood",
            },
          ],
        ],
        [
          "Male",
          "Terri",
          [
            {
              "email": "tsustins1s@mapy.cz",
              "first_name": "Terri",
              "gender": "Male",
              "id": 65,
              "ip_address": "233.27.34.220",
              "last_name": "Sustins",
            },
          ],
        ],
        [
          "Male",
          "Winn",
          [
            {
              "email": "wcudbertson1t@baidu.com",
              "first_name": "Winn",
              "gender": "Male",
              "id": 66,
              "ip_address": "162.160.52.212",
              "last_name": "Cudbertson",
            },
          ],
        ],
        [
          "Male",
          "Si",
          [
            {
              "email": "srizzardini1v@buzzfeed.com",
              "first_name": "Si",
              "gender": "Male",
              "id": 68,
              "ip_address": "222.203.65.246",
              "last_name": "Rizzardini",
            },
          ],
        ],
        [
          "Male",
          "Hayes",
          [
            {
              "email": "hwindeatt1w@linkedin.com",
              "first_name": "Hayes",
              "gender": "Male",
              "id": 69,
              "ip_address": "47.41.193.10",
              "last_name": "Windeatt",
            },
          ],
        ],
        [
          "Male",
          "Lydon",
          [
            {
              "email": "lcicchitello1x@cnet.com",
              "first_name": "Lydon",
              "gender": "Male",
              "id": 70,
              "ip_address": "130.237.93.120",
              "last_name": "Cicchitello",
            },
          ],
        ],
        [
          "Male",
          "Monti",
          [
            {
              "email": "msapseed1y@flavors.me",
              "first_name": "Monti",
              "gender": "Male",
              "id": 71,
              "ip_address": "3.214.130.238",
              "last_name": "Sapseed",
            },
          ],
        ],
        [
          "Male",
          "Maxy",
          [
            {
              "email": "mpowner20@indiatimes.com",
              "first_name": "Maxy",
              "gender": "Male",
              "id": 73,
              "ip_address": "59.212.85.255",
              "last_name": "Powner",
            },
          ],
        ],
        [
          "Male",
          "Douglass",
          [
            {
              "email": "dangear21@dropbox.com",
              "first_name": "Douglass",
              "gender": "Male",
              "id": 74,
              "ip_address": "167.225.39.110",
              "last_name": "Angear",
            },
          ],
        ],
        [
          "Male",
          "Adolphe",
          [
            {
              "email": "aperotti22@edublogs.org",
              "first_name": "Adolphe",
              "gender": "Male",
              "id": 75,
              "ip_address": "6.96.223.233",
              "last_name": "Perotti",
            },
          ],
        ],
        [
          "Male",
          "Graig",
          [
            {
              "email": "gmanning23@last.fm",
              "first_name": "Graig",
              "gender": "Male",
              "id": 76,
              "ip_address": "152.202.214.10",
              "last_name": "Manning",
            },
          ],
        ],
        [
          "Male",
          "Scotti",
          [
            {
              "email": "smonte26@home.pl",
              "first_name": "Scotti",
              "gender": "Male",
              "id": 79,
              "ip_address": "159.230.32.251",
              "last_name": "Monte",
            },
          ],
        ],
        [
          "Male",
          "Mead",
          [
            {
              "email": "mderuel27@psu.edu",
              "first_name": "Mead",
              "gender": "Male",
              "id": 80,
              "ip_address": "71.118.39.175",
              "last_name": "De Ruel",
            },
          ],
        ],
        [
          "Male",
          "Noam",
          [
            {
              "email": "nbleby28@issuu.com",
              "first_name": "Noam",
              "gender": "Male",
              "id": 81,
              "ip_address": "104.237.197.211",
              "last_name": "Bleby",
            },
          ],
        ],
        [
          "Male",
          "Penny",
          [
            {
              "email": "pscorthorne29@usgs.gov",
              "first_name": "Penny",
              "gender": "Male",
              "id": 82,
              "ip_address": "9.202.127.225",
              "last_name": "Scorthorne",
            },
          ],
        ],
        [
          "Male",
          "Chancey",
          [
            {
              "email": "cscottrell2a@cmu.edu",
              "first_name": "Chancey",
              "gender": "Male",
              "id": 83,
              "ip_address": "121.116.82.163",
              "last_name": "Scottrell",
            },
          ],
        ],
        [
          "Male",
          "Patrizius",
          [
            {
              "email": "pfley2d@addthis.com",
              "first_name": "Patrizius",
              "gender": "Male",
              "id": 86,
              "ip_address": "88.45.107.11",
              "last_name": "Fley",
            },
          ],
        ],
        [
          "Male",
          "Jard",
          [
            {
              "email": "jtedstone2e@independent.co.uk",
              "first_name": "Jard",
              "gender": "Male",
              "id": 87,
              "ip_address": "85.52.78.162",
              "last_name": "Tedstone",
            },
          ],
        ],
        [
          "Male",
          "Dal",
          [
            {
              "email": "dmclellan2g@odnoklassniki.ru",
              "first_name": "Dal",
              "gender": "Male",
              "id": 89,
              "ip_address": "27.209.35.68",
              "last_name": "McLellan",
            },
          ],
        ],
        [
          "Male",
          "Jarib",
          [
            {
              "email": "jlaugharne2h@java.com",
              "first_name": "Jarib",
              "gender": "Male",
              "id": 90,
              "ip_address": "229.248.128.116",
              "last_name": "Laugharne",
            },
          ],
        ],
        [
          "Male",
          "Nikita",
          [
            {
              "email": "ngumary2j@mayoclinic.com",
              "first_name": "Nikita",
              "gender": "Male",
              "id": 92,
              "ip_address": "82.194.215.137",
              "last_name": "Gumary",
            },
          ],
        ],
        [
          "Male",
          "Olenolin",
          [
            {
              "email": "olinnock2k@oracle.com",
              "first_name": "Olenolin",
              "gender": "Male",
              "id": 93,
              "ip_address": "27.60.169.68",
              "last_name": "Linnock",
            },
          ],
        ],
        [
          "Male",
          "Kingsley",
          [
            {
              "email": "ksissens2l@answers.com",
              "first_name": "Kingsley",
              "gender": "Male",
              "id": 94,
              "ip_address": "175.170.27.126",
              "last_name": "Sissens",
            },
          ],
        ],
        [
          "Male",
          "Jordon",
          [
            {
              "email": "jwesthofer2m@mtv.com",
              "first_name": "Jordon",
              "gender": "Male",
              "id": 95,
              "ip_address": "145.122.125.183",
              "last_name": "Westhofer",
            },
          ],
        ],
        [
          "Male",
          "Forest",
          [
            {
              "email": "fmaccrossan2n@tinypic.com",
              "first_name": "Forest",
              "gender": "Male",
              "id": 96,
              "ip_address": "35.166.7.49",
              "last_name": "MacCrossan",
            },
          ],
        ],
        [
          "Male",
          "Farris",
          [
            {
              "email": "fbentjens2o@ihg.com",
              "first_name": "Farris",
              "gender": "Male",
              "id": 97,
              "ip_address": "22.90.170.11",
              "last_name": "Bentjens",
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
          "Female",
          "Nerissa",
          [
            {
              "email": "nelijahuo@tripod.com",
              "first_name": "Nerissa",
              "gender": "Female",
              "id": 25,
              "ip_address": "115.192.186.28",
              "last_name": "Elijahu",
            },
          ],
        ],
        [
          "Female",
          "Bayard",
          [
            {
              "email": "bsignt@accuweather.com",
              "first_name": "Bayard",
              "gender": "Female",
              "id": 30,
              "ip_address": "192.179.1.49",
              "last_name": "Sign",
            },
          ],
        ],
        [
          "Female",
          "Felecia",
          [
            {
              "email": "fleathartv@opera.com",
              "first_name": "Felecia",
              "gender": "Female",
              "id": 32,
              "ip_address": "105.106.133.225",
              "last_name": "Leathart",
            },
          ],
        ],
        [
          "Female",
          "Meredithe",
          [
            {
              "email": "mmcmasterz@boston.com",
              "first_name": "Meredithe",
              "gender": "Female",
              "id": 36,
              "ip_address": "128.211.105.14",
              "last_name": "McMaster",
            },
          ],
        ],
        [
          "Female",
          "Eunice",
          [
            {
              "email": "ewabersich11@umich.edu",
              "first_name": "Eunice",
              "gender": "Female",
              "id": 38,
              "ip_address": "72.44.102.127",
              "last_name": "Wabersich",
            },
          ],
        ],
        [
          "Female",
          "Constanta",
          [
            {
              "email": "cdeverill12@amazon.de",
              "first_name": "Constanta",
              "gender": "Female",
              "id": 39,
              "ip_address": "225.185.192.72",
              "last_name": "Deverill",
            },
          ],
        ],
        [
          "Female",
          "Remy",
          [
            {
              "email": "rhailston14@usatoday.com",
              "first_name": "Remy",
              "gender": "Female",
              "id": 41,
              "ip_address": "189.214.70.127",
              "last_name": "Hailston",
            },
          ],
        ],
        [
          "Female",
          "Harriott",
          [
            {
              "email": "hrassell16@moonfruit.com",
              "first_name": "Harriott",
              "gender": "Female",
              "id": 43,
              "ip_address": "67.206.2.174",
              "last_name": "Rassell",
            },
          ],
        ],
        [
          "Female",
          "Miguela",
          [
            {
              "email": "mrolf17@ifeng.com",
              "first_name": "Miguela",
              "gender": "Female",
              "id": 44,
              "ip_address": "199.75.255.89",
              "last_name": "Rolf",
            },
          ],
        ],
        [
          "Female",
          "Stormie",
          [
            {
              "email": "scopestake19@infoseek.co.jp",
              "first_name": "Stormie",
              "gender": "Female",
              "id": 46,
              "ip_address": "246.75.115.251",
              "last_name": "Copestake",
            },
          ],
        ],
        [
          "Female",
          "Anetta",
          [
            {
              "email": "acongreve1a@i2i.jp",
              "first_name": "Anetta",
              "gender": "Female",
              "id": 47,
              "ip_address": "186.67.142.65",
              "last_name": "Congreve",
            },
          ],
        ],
        [
          "Female",
          "Ashley",
          [
            {
              "email": "aalben1b@ca.gov",
              "first_name": "Ashley",
              "gender": "Female",
              "id": 48,
              "ip_address": "35.175.215.193",
              "last_name": "Alben",
            },
          ],
        ],
        [
          "Female",
          "Sherill",
          [
            {
              "email": "sshakesby1d@comcast.net",
              "first_name": "Sherill",
              "gender": "Female",
              "id": 50,
              "ip_address": "197.72.132.217",
              "last_name": "Shakesby",
            },
          ],
        ],
        [
          "Female",
          "Mimi",
          [
            {
              "email": "mjesteco1g@independent.co.uk",
              "first_name": "Mimi",
              "gender": "Female",
              "id": 53,
              "ip_address": "98.31.238.44",
              "last_name": "Jesteco",
            },
          ],
        ],
        [
          "Female",
          "Maudie",
          [
            {
              "email": "maspling1h@businessweek.com",
              "first_name": "Maudie",
              "gender": "Female",
              "id": 54,
              "ip_address": "44.86.242.125",
              "last_name": "Aspling",
            },
          ],
        ],
        [
          "Female",
          "Garland",
          [
            {
              "email": "gmaxsted1i@unesco.org",
              "first_name": "Garland",
              "gender": "Female",
              "id": 55,
              "ip_address": "27.153.59.199",
              "last_name": "Maxsted",
            },
          ],
        ],
        [
          "Female",
          "Raeann",
          [
            {
              "email": "rchill1j@yahoo.co.jp",
              "first_name": "Raeann",
              "gender": "Female",
              "id": 56,
              "ip_address": "47.78.99.201",
              "last_name": "Chill",
            },
          ],
        ],
        [
          "Female",
          "Laurie",
          [
            {
              "email": "lpotes1k@1und1.de",
              "first_name": "Laurie",
              "gender": "Female",
              "id": 57,
              "ip_address": "148.64.236.144",
              "last_name": "Potes",
            },
          ],
        ],
        [
          "Female",
          "Elita",
          [
            {
              "email": "ebetun1m@oaic.gov.au",
              "first_name": "Elita",
              "gender": "Female",
              "id": 59,
              "ip_address": "117.65.35.18",
              "last_name": "Betun",
            },
          ],
        ],
        [
          "Female",
          "Lorette",
          [
            {
              "email": "lhigbin1o@nationalgeographic.com",
              "first_name": "Lorette",
              "gender": "Female",
              "id": 61,
              "ip_address": "104.142.23.112",
              "last_name": "Higbin",
            },
          ],
        ],
        [
          "Female",
          "Mallissa",
          [
            {
              "email": "moleszkiewicz1q@craigslist.org",
              "first_name": "Mallissa",
              "gender": "Female",
              "id": 63,
              "ip_address": "81.129.160.73",
              "last_name": "Oleszkiewicz",
            },
          ],
        ],
        [
          "Female",
          "Milena",
          [
            {
              "email": "mwalthew1u@pagesperso-orange.fr",
              "first_name": "Milena",
              "gender": "Female",
              "id": 67,
              "ip_address": "223.10.7.96",
              "last_name": "Walthew",
            },
          ],
        ],
        [
          "Female",
          "Maxie",
          [
            {
              "email": "mjuarez1z@nasa.gov",
              "first_name": "Maxie",
              "gender": "Female",
              "id": 72,
              "ip_address": "228.219.125.113",
              "last_name": "Juarez",
            },
          ],
        ],
        [
          "Female",
          "Stacee",
          [
            {
              "email": "shemms24@zimbio.com",
              "first_name": "Stacee",
              "gender": "Female",
              "id": 77,
              "ip_address": "119.254.154.156",
              "last_name": "Hemms",
            },
          ],
        ],
        [
          "Female",
          "Diahann",
          [
            {
              "email": "dcoughan25@hatena.ne.jp",
              "first_name": "Diahann",
              "gender": "Female",
              "id": 78,
              "ip_address": "195.205.93.90",
              "last_name": "Coughan",
            },
          ],
        ],
        [
          "Female",
          "Carmella",
          [
            {
              "email": "cmaytum2b@hibu.com",
              "first_name": "Carmella",
              "gender": "Female",
              "id": 84,
              "ip_address": "151.211.244.97",
              "last_name": "Maytum",
            },
          ],
        ],
        [
          "Female",
          "Ida",
          [
            {
              "email": "idannatt2c@weather.com",
              "first_name": "Ida",
              "gender": "Female",
              "id": 85,
              "ip_address": "243.56.94.118",
              "last_name": "Dannatt",
            },
          ],
        ],
        [
          "Female",
          "Kalindi",
          [
            {
              "email": "kgorcke2f@istockphoto.com",
              "first_name": "Kalindi",
              "gender": "Female",
              "id": 88,
              "ip_address": "223.157.32.147",
              "last_name": "Gorcke",
            },
          ],
        ],
        [
          "Female",
          "Marylynne",
          [
            {
              "email": "mfenwick2i@npr.org",
              "first_name": "Marylynne",
              "gender": "Female",
              "id": 91,
              "ip_address": "104.230.160.81",
              "last_name": "Fenwick",
            },
          ],
        ],
        [
          "Female",
          "Nichole",
          [
            {
              "email": "ndevo2p@unc.edu",
              "first_name": "Nichole",
              "gender": "Female",
              "id": 98,
              "ip_address": "1.233.181.187",
              "last_name": "Devo",
            },
          ],
        ],
        [
          "Female",
          "Gavra",
          [
            {
              "email": "ggeorgins2q@live.com",
              "first_name": "Gavra",
              "gender": "Female",
              "id": 99,
              "ip_address": "203.49.189.142",
              "last_name": "Georgins",
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
          "Genderqueer",
          "Almire",
          [
            {
              "email": "alehrian2r@example.com",
              "first_name": "Almire",
              "gender": "Genderqueer",
              "id": 100,
              "ip_address": "133.110.198.248",
              "last_name": "Lehrian",
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
        [
          "Agender",
          "Moritz",
          [
            {
              "email": "mhendrich1l@mysql.com",
              "first_name": "Moritz",
              "gender": "Agender",
              "id": 58,
              "ip_address": "63.157.151.11",
              "last_name": "Hendrich",
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
        "Genderfluid" => {
          "email": "jcrookstonq@blogs.com",
          "first_name": "Joane",
          "gender": "Genderfluid",
          "id": 27,
          "ip_address": "105.4.120.75",
          "last_name": "Crookston",
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
        [
          "Genderfluid",
          {
            "email": "jcrookstonq@blogs.com",
            "first_name": "Joane",
            "gender": "Genderfluid",
            "id": 27,
            "ip_address": "105.4.120.75",
            "last_name": "Crookston",
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
        "Male" => 50,
        "Female" => 42,
        "Genderqueer" => 2,
        "Agender" => 2,
        "Genderfluid" => 1,
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
              5,
            ],
            [
              "J",
              1,
            ],
            [
              "M",
              10,
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
              3,
            ],
            [
              "C",
              3,
            ],
            [
              "E",
              3,
            ],
            [
              "B",
              1,
            ],
            [
              "F",
              1,
            ],
            [
              "R",
              2,
            ],
            [
              "H",
              1,
            ],
            [
              "S",
              3,
            ],
            [
              "G",
              2,
            ],
            [
              "L",
              2,
            ],
            [
              "D",
              1,
            ],
            [
              "I",
              1,
            ],
            [
              "K",
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
            [
              "A",
              1,
            ],
          ],
        ],
        [
          "Male",
          [
            [
              "J",
              6,
            ],
            [
              "S",
              4,
            ],
            [
              "B",
              3,
            ],
            [
              "F",
              4,
            ],
            [
              "I",
              1,
            ],
            [
              "C",
              3,
            ],
            [
              "E",
              2,
            ],
            [
              "R",
              3,
            ],
            [
              "A",
              3,
            ],
            [
              "D",
              4,
            ],
            [
              "L",
              2,
            ],
            [
              "Z",
              1,
            ],
            [
              "T",
              1,
            ],
            [
              "W",
              1,
            ],
            [
              "H",
              1,
            ],
            [
              "M",
              3,
            ],
            [
              "G",
              1,
            ],
            [
              "N",
              2,
            ],
            [
              "P",
              2,
            ],
            [
              "O",
              1,
            ],
            [
              "K",
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
            [
              "M",
              1,
            ],
          ],
        ],
        [
          "Genderfluid",
          [
            [
              "J",
              1,
            ],
          ],
        ],
      ]
    `)
  }
)
