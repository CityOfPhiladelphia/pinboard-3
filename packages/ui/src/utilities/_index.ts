/*
Central file to simplify importing functions into app projects.
Contains references to exported functions and useful constants and regular expressions
*/

import { getHaversineDistance } from './getHaversineDistance'
import { hasLocationData } from './hasLocationData'

export const StreetAddress: Readonly<RegExp> =
  /^(?:\d{1,5}(?:-\d{1,5})?[A-Za-z]{0,3} )(?:(?:(?:[NnSs](?:[Oo][RrUu][Tt][Hh])?)|(?:[EeWw](?:[AaEe][Ss][Tt])?)){0,2} )?\w+ \w{2,}$/

export const StreetIntersection: Readonly<RegExp> =
  /^(?:(?:(?:[NnSs](?:[Oo][RrUu][Tt][Hh])?)|(?:[EeWw](?:[AaEe][Ss][Tt])?)){0,2} )?\w+ (?:\w{2,} )?(?:(?:&)|(?:[Aa][Nn][Dd])) (?:(?:(?:[NnSs](?:[Oo][RrUu][Tt][Hh])?)|(?:[EeWw](?:[AaEe][Ss][Tt])?)){0,2} )?\w+(?: \w{2,})?$/

export const Zipcode: Readonly<RegExp> = /^\d{5}(?:-\d{4})?$/

export { getHaversineDistance, hasLocationData }
