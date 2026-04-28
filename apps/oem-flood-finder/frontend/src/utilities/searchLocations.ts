import { toValue, type Ref } from 'vue'
import type { OemLocation } from '@/types'

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
