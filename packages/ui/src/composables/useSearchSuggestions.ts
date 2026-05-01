import { type Ref, ref, toValue, watchEffect } from 'vue'
import type { AisAutocompleteResult } from '../types'

export function useSearchSuggestions(search: string | Ref<string>) {
  const searchSuggestions = ref<string[]>([])
  const searchSuggestionsError = ref<unknown>(null)

  async function getSearchSuggestions() {
    const stringValue = toValue(search)
    if (!stringValue || stringValue.length < 3) {
      searchSuggestions.value = []
      return
    }

    try {
      const response = await fetch(
        `https://ais-autocomplete.citygeo.phila.city/autocomplete?q=${stringValue.replace(/ /, '+')}`
      )
      const suggestions: AisAutocompleteResult = await response.json()
      const suggestedAddresses = suggestions.count
        ? Array.from(
            suggestions.results.addresses,
            (suggestion) => suggestion.address
          )
        : []
      searchSuggestions.value = suggestedAddresses
    } catch (err) {
      searchSuggestionsError.value = err
    }
  }

  watchEffect(() => {
    getSearchSuggestions()
  })

  return { searchSuggestions, searchSuggestionsError }
}
