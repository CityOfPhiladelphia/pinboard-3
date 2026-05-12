import { type Ref, ref, toValue, watch } from 'vue'
import type { AisAutocompleteResult } from '../types'

export function useSearchSuggestions(search: string | Ref<string>) {
  const searchSuggestions = ref<string[]>([])
  const searchSuggestionsError = ref<unknown>(null)
  let skipNextFetch = false

  async function getSearchSuggestions(stringValue: string) {
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

  function dismissSuggestions() {
    skipNextFetch = true
    searchSuggestions.value = []
  }

  function hideSuggestions() {
    searchSuggestions.value = []
  }

  function refetchSuggestions() {
    getSearchSuggestions(toValue(search))
  }

  watch(
    () => toValue(search),
    (value) => {
      if (skipNextFetch) {
        skipNextFetch = false
        return
      }
      getSearchSuggestions(value)
    }
  )

  return {
    searchSuggestions,
    searchSuggestionsError,
    dismissSuggestions,
    hideSuggestions,
    refetchSuggestions,
  }
}
