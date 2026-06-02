import { type Ref, ref, toValue, watch } from 'vue'
import type { AisAutocompleteResult, ProxyAutocompleteResult } from '../types'

export function useSearchSuggestions(search: string | Ref<string>) {
  const searchSuggestions = ref<string[]>([])
  const searchSuggestionsError = ref<unknown>(null)
  let skipNextFetch = false

  async function getSearchSuggestions(stringValue: string) {
    if (!stringValue || !/^(?:\d{1,5}(?:-\d{1,5})?[A-Za-z]{0,3} \w+)/.test(stringValue)) {
      searchSuggestions.value = []
      return
    }
    await queryAisAutocomplete(stringValue, searchSuggestions, searchSuggestionsError)
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

async function queryAisAutocomplete(
  stringValue: string,
  searchSuggestions: Ref<string[]>,
  searchSuggestionsError: Ref<unknown>
) {
  try {
    const response = await fetch(
      `https://haydr3k097.execute-api.us-east-1.amazonaws.com/queryAis/autocomplete?q=${encodeURIComponent(stringValue)}&client_id=${import.meta.env.DEV ? import.meta.env.VITE_AIS_CLIENTID_OEMFLOOD : ''}`
    )

    if (response.ok) {
      const suggestions: ProxyAutocompleteResult = await response.json()
      searchSuggestions.value = suggestions
      return
    }

    searchSuggestionsError.value = response
  } catch (err) {
    searchSuggestionsError.value = err
  }
}
