import type { OemLocation } from '@/types'
import { toValue, type Ref } from 'vue'

export function searchLocations(
  locations: Ref<OemLocation[]> | OemLocation[],
  searchKeywords: Ref<string>,
) {
  locations = toValue(locations)
  const searchTerms = searchKeywords.value.replace(/\W+/, ' ').toLowerCase().split(' ')
  return locations.filter((loc) => {
    const locString = JSON.stringify(Object.values(loc)).toLowerCase()
    return searchTerms.some((term) => locString.match(term))
  })
}
