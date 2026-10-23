import { toValue, type MaybeRef } from 'vue'
import type { BasicLocation } from '../types'

export function searchLocations<T extends BasicLocation>(
  locations: MaybeRef<T[]>,
  searchKeywords: MaybeRef<string>
) {
  const locsVal = toValue(locations)
  const termsVal = toValue(searchKeywords)
  const searchTerms = termsVal.replace(/\W+/, ' ').toLocaleLowerCase().split(' ')
  const matches = locsVal.filter((loc) => {
    const locString = JSON.stringify(Object.values(loc)).toLocaleLowerCase()
    return searchTerms.some((term) => locString.match(term))
  })
  return matches
}
