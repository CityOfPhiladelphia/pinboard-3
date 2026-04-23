import { Ref, ref, toValue, watchEffect } from 'vue'
import type { AisAutocompleteResult } from '../types'

export function useSearchSuggestions(search: string | Ref<string, string>) {
  const searchSuggestions = ref<string[]>([])
  const searchSuggestionsError = ref(null)

  async function getSearchSuggestions() {
    const stringValue = toValue(search)
    // console.log(stringValue)
    if (!stringValue || stringValue.length < 3) {
      return []
    }

    fetch(
      `https://ais-autocomplete.citygeo.phila.city/autocomplete?q=${stringValue.replace(/ /, '+')}`
    )
      .then((res) => res.json())
      .then((json) => {
        const suggestions: AisAutocompleteResult = json
        const suggestedAddresses = suggestions.count
          ? Array.from(
              suggestions.results.addresses,
              (suggestion) => suggestion.address
            )
          : []
        searchSuggestions.value = suggestedAddresses
      })
      .catch((err) => (searchSuggestionsError.value = err))
  }

  watchEffect(() => {
    getSearchSuggestions()
  })

  return { searchSuggestions, searchSuggestionsError }
}
