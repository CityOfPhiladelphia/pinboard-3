<!-- ABOUTME: AIS-backed address search on phila-ui Search/SearchSuggestions. Typing fires
     /autocomplete (debounced); picking a suggestion fires /search and emits select(feature). -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, SearchSuggestions } from '@phila/phila-ui-search'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
import {
  autocompleteAddresses,
  searchAddress,
  type AisAutocompleteResult,
  type AisFeature,
} from '@/composables/useAis'

const emit = defineEmits<{ select: [feature: AisFeature] }>()

const RESOLVE_ERROR = "Couldn't resolve that address."

const { query, results, loading, error } = useDebouncedSearch<AisAutocompleteResult[]>({
  initial: [],
  fetcher: (q, signal) => autocompleteAddresses(q, signal),
})

// Closed after a pick: echoing the resolved address into `query` re-fires the
// debounced autocomplete, and the list must not reopen until the user types.
const open = ref(false)

// True while searchAddress is resolving a picked result (open is false during this).
const resolving = ref(false)

const searchRef = ref<InstanceType<typeof Search> | null>(null)
const suggestionsRef = ref<InstanceType<typeof SearchSuggestions> | null>(null)

const isOpen = computed(() => open.value && results.value.length > 0)
// SearchSuggestions renders flat strings, so the city rides along in the label.
const suggestions = computed(() => results.value.map((r) => `${r.address} — Philadelphia, PA`))

function onQueryChange(value: string) {
  query.value = value
  open.value = true
}

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  if (e.key === 'ArrowDown' && isOpen.value && target.tagName === 'INPUT') {
    e.preventDefault()
    suggestionsRef.value?.focusFirst()
  } else if (e.key === 'Escape') {
    open.value = false
  }
}

function onFocusOut(e: FocusEvent) {
  const related = e.relatedTarget as HTMLElement | null
  if (!(e.currentTarget as HTMLElement).contains(related)) open.value = false
}

function onDismiss() {
  open.value = false
  searchRef.value?.focus()
}

async function onSelect(suggestion: string) {
  const r = results.value[suggestions.value.indexOf(suggestion)]
  if (!r) return
  open.value = false
  resolving.value = true
  error.value = null
  try {
    const feature = await searchAddress(r.searchAddress)
    if (feature) {
      emit('select', feature)
      query.value = feature.streetAddress
      results.value = []
    } else {
      error.value = RESOLVE_ERROR
    }
  } catch {
    error.value = RESOLVE_ERROR
  } finally {
    resolving.value = false
  }
}
</script>

<template>
  <div class="address-search" @keydown="onKeydown" @focusout="onFocusOut">
    <Search
      ref="searchRef"
      :model-value="query"
      placeholder="Enter an address, intersection, or place"
      @update:model-value="onQueryChange"
    />
    <p v-if="(open && loading) || resolving" class="address-search__loading">Searching&hellip;</p>
    <p v-if="error" class="address-search__error" role="alert">{{ error }}</p>
    <SearchSuggestions
      v-if="isOpen"
      ref="suggestionsRef"
      :suggestions="suggestions"
      @select="onSelect"
      @dismiss="onDismiss"
    />
  </div>
</template>

<style scoped>
.address-search__loading,
.address-search__error {
  margin: var(--spacing-xs, 0.5rem) 0 0;
  font-size: 0.875rem;
}
.address-search__error {
  color: var(--Schemes-Error, #c0392b);
}
</style>
