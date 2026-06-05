import { type Ref, ref, toValue, watch } from 'vue'
import type { ProxyAutocompleteResult } from '../types'

export function useSearchSuggestions(search: string | Ref<string>) {
  const searchSuggestions = ref<string[]>([])
  const searchSuggestionsError = ref<unknown>(null)
  let skipNextFetch = false

  async function getSearchSuggestions(stringValue: string) {
    if (!stringValue || !/^(?:\d{1,5}(?:-\d{1,5})?[A-Za-z]{0,3} \w+)/.test(stringValue)) {
      searchSuggestions.value = []
      return
    }
    try {
      const response = await fetch(
        `https://haydr3k097.execute-api.us-east-1.amazonaws.com/queryAis/autocomplete?q=${encodeURIComponent(stringValue)}&simple=true${import.meta.env.DEV ? `&client_id=${import.meta.env.VITE_AIS_CLIENTID_OEMFLOOD}` : ''}`
      )
      if (!response.ok) {
        searchSuggestionsError.value = { status: response.status, message: response.body }
        return
      }
      searchSuggestions.value = (await response.json()) as ProxyAutocompleteResult
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
