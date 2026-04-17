import { ref } from 'vue'
import type { AisAutocompleteResult } from '../types'

const searchString = ref<string>('')
const searchSuggestions = ref<string[]>([])

async function updateSearchSuggestions(): Promise<string[]> {
  if (
    searchString.value.length < 3 ||
    !/^\d{1,5}(?: [NnSs])? [A-Za-z ]*/.test(searchString.value)
  ) {
    return []
  }
  const suggestions: AisAutocompleteResult = await (
    await fetch(
      `https://ais-autocomplete.citygeo.phila.city/autocomplete?q=${searchString.value.replace(/ /, '+')}`
    )
  ).json()
  const suggestedAddresses = suggestions.count
    ? Array.from(
        suggestions.results.addresses,
        (suggestion) => suggestion.address
      )
    : []
  return suggestedAddresses
}
