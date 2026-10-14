<script setup lang="ts">
// vue imports
import { ref, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

// 3rd party imports
// philly ui imports
import { Search } from '@phila/phila-ui-search'

// pinboard component imports
import SearchSuggestions from './SearchSuggestions.vue'

// pinboard composables imports
import { useSearchSuggestions } from '../composables/useSearchSuggestions'
import { useRecentSearches } from '../composables/useRecentSearches'
import { PINBOARD_CONFIG_KEY } from '../keys.ts'

// type imports
import type { UserLocationState } from '../types'

// models
const searchString = defineModel<string>('search-string', { default: '' })
const userLocationState = defineModel<UserLocationState>('user-location-state', {
  default: 'unknown',
})

// props
const props = defineProps<{
  searchPlaceholder: string | undefined
  searchShape?: 'rectangle' | 'pill'
  isMobile: boolean
}>()

// emits
const emit = defineEmits<{
  search: []
}>()

const config = inject(PINBOARD_CONFIG_KEY)
const { t } = useI18n()

// refs
const searchWrapperRef = ref<HTMLElement | null>(null)
const suggestionsRef = ref<InstanceType<typeof SearchSuggestions> | null>(null)
const { searchSuggestions, dismissSuggestions, hideSuggestions, refetchSuggestions } =
  useSearchSuggestions(searchString)
const {
  recentSearches,
  add: addRecentSearch,
  remove: removeRecentSearch,
} = useRecentSearches(config?.appId)
const searchFocused = ref(false)

// computed refs
const showingRecents = computed(() => !searchString.value)

const dropdownSuggestions = computed(() => {
  // Empty field → recent searches; typing → AIS autocomplete.
  if (!searchFocused.value) return []
  return searchString.value ? searchSuggestions.value : recentSearches.value
})

const elevatedSearch = computed(() => {
  // Elevate the floating search only when the cluster sits over the map (mobile + map placement).
  return props.isMobile && config?.mobileFilterPlacement === 'map'
})

const cornerShape = computed(() => {
  return {
    'border-radius':
      props.searchShape === 'pill'
        ? '0 0 2.4rem 2.4rem'
        : '0 0 var(--border-radius-s, 4px) var(--border-radius-s, 4px)',
    'box-shadow': dropdownSuggestions.value.length ? 'var(--elevation-light-2)' : 'none',
  }
})

// event handlers
function handleSearchInput(event: InputEvent) {
  // v-model does not update while an IME is composing, and Android predictive text
  // composes ordinary words — so searchString would sit stale until the keyboard
  // closed, and the suggestions never fetched. Read the value off the DOM instead.
  // Vue skips writing back to the input while composing, so the IME is unaffected.
  const target = event.target as HTMLInputElement
  if (target.tagName === 'INPUT') {
    searchString.value = target.value
  }
}

function handleSearchSubmit() {
  const term = searchString.value.trim()
  if (term) {
    addRecentSearch(term)
    if (term !== searchString.value) {
      searchString.value = term
    }
  }
  emit('search')
}

function handleSuggestionSelect(suggestion: string) {
  dismissSuggestions()
  searchString.value = suggestion
  handleSearchSubmit()
  focusSearchInput()
}

function handleSuggestionRemove(term: string) {
  removeRecentSearch(term)
  // Keep focus in the search area so the dropdown stays open for removing more.
  focusSearchInput()
}

function handleSearchKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  if (event.key === 'ArrowDown' && dropdownSuggestions.value.length && target.tagName === 'INPUT') {
    event.preventDefault()
    suggestionsRef.value?.focusFirst()
  }
}

function handleSuggestionDismiss() {
  focusSearchInput()
}

function handleSearchFocusOut(event: FocusEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement | null
  if (!searchWrapperRef.value?.contains(relatedTarget)) {
    searchFocused.value = false
    hideSuggestions()
  }
}

function handleSearchFocusIn(event: FocusEvent) {
  searchFocused.value = true
  const relatedTarget = event.relatedTarget as HTMLElement | null
  if (!searchWrapperRef.value?.contains(relatedTarget)) {
    refetchSuggestions()
  }
}

// utility functions
function focusSearchInput() {
  const input = searchWrapperRef.value?.querySelector<HTMLElement>('input')
  input?.focus()
}
</script>

<template>
  <div
    v-if="searchPlaceholder"
    ref="searchWrapperRef"
    class="location-search-wrapper"
    :class="{ mobile: isMobile }"
    @keydown="handleSearchKeydown"
    @focusout="handleSearchFocusOut"
    @focusin="handleSearchFocusIn"
    @input="handleSearchInput"
  >
    <Search
      v-model="searchString"
      class="location-search-input"
      :placeholder="searchPlaceholder"
      :elevated="elevatedSearch"
      @search="handleSearchSubmit"
    />
    <div class="search-suggestions-container" :style="cornerShape">
      <SearchSuggestions
        ref="suggestionsRef"
        v-model:user-location-state="userLocationState"
        :suggestions="dropdownSuggestions"
        :heading="showingRecents ? t('pinboard.recentSearches') : undefined"
        :removable="showingRecents"
        :remove-label="t('pinboard.removeRecentSearch')"
        @select="handleSuggestionSelect"
        @dismiss="handleSuggestionDismiss"
        @remove="handleSuggestionRemove"
      />
    </div>
  </div>
</template>

<style scoped>
.location-search-wrapper {
  grid-area: search;
  position: relative;
}

/* Teleported onto the map (mobile): the container supplies the top inset, so
   keep only the 1rem side inset that aligns the search bar with the chip row. */
.location-search.mobile {
  padding: 0 1rem;
}

.search-suggestions-container {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--Schemes-Background, #fff);
  border: 0px dotted var(--Schemes-Border-low, #ccc);
  clip-path: inset(0 -8px -8px -8px);
  max-height: 15lh;
  overflow: hidden;
  scrollbar-width: thin;
}
</style>
