/*
Central file to simplify importing functions into app projects.
Contains references to exported functions and useful constants and regular expressions
*/

import { sortLocations } from './sortLocations'
import { getHaversineDistance } from './getHaversineDistance'
import { hasLocationData } from './hasLocationData'
import { slugify } from './slugify'

// A house number (optional range and unit-letter suffix) followed by at least
// one more token. Liberal on purpose: shorthand like "943 sigel" should reach
// AIS, matching the old finders. Pure ZIPs have no following token, so they fall
// through to the Zipcode check; non-numeric text stays a keyword.
const StreetAddress: Readonly<RegExp> = /^\d{1,5}(?:-\d{1,5})?[A-Za-z]{0,3}\s+\S+/

const StreetIntersection: Readonly<RegExp> =
  /^(?:(?:(?:[NnSs](?:[Oo][RrUu][Tt][Hh])?)|(?:[EeWw](?:[AaEe][Ss][Tt])?)){0,2} )?\w+ (?:\w{2,} )?(?:(?:&)|(?:[Aa][Nn][Dd])) (?:(?:(?:[NnSs](?:[Oo][RrUu][Tt][Hh])?)|(?:[EeWw](?:[AaEe][Ss][Tt])?)){0,2} )?\w+(?: \w{2,})?$/

const Zipcode: Readonly<RegExp> = /^\d{5}(?:-\d{4})?$/

export {
  sortLocations,
  getHaversineDistance,
  hasLocationData,
  slugify,
  StreetAddress,
  StreetIntersection,
  Zipcode,
}
