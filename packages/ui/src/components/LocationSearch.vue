<script setup lang="ts">
// vue imports
import { ref, computed, inject, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// philly ui imports
import { Search } from '@phila/phila-ui-search'

// pinboard component imports
import SearchSuggestions from './SearchSuggestions.vue'

// pinboard composables imports
import { useSearchSuggestions } from '../composables/useSearchSuggestions'
import { useRecentSearches } from '../composables/useRecentSearches'
import { PINBOARD_CONFIG_KEY } from '../keys.ts'

// models
const searchString = defineModel<string>('search-string', { default: '' })
const dropdownOpen = defineModel<boolean>('dropdownOpen', {
  default: false,
})
const locatingUser = defineModel<boolean>('locatingUser', {
  default: false,
})

// props
const props = defineProps<{
  searchPlaceholder: string | undefined
  searchShape?: 'rectangle' | 'pill'
  elevated: boolean
  showGeolocate?: boolean
}>()

// emits
const emit = defineEmits<{
  search: []
  geolocate: []
}>()

// slots
const slots = defineSlots<{
  'no-results'?: unknown
  'suggestion-card'?: unknown
}>()

const config = inject(PINBOARD_CONFIG_KEY)
const { t } = useI18n()

// refs
const searchWrapperRef = ref<HTMLElement | null>(null)
const suggestionsRef = ref<InstanceType<typeof SearchSuggestions> | null>(null)
const { searchSuggestions, refetchSuggestions } = useSearchSuggestions(searchString)
const {
  recentSearches,
  add: addRecentSearch,
  remove: removeRecentSearch,
} = useRecentSearches(config?.appId)
const searchFocused = ref(false)

// computed refs
const cornerShape = computed(() => {
  return {
    'border-radius':
      props.searchShape === 'pill'
        ? '0 0 2.4rem 2.4rem'
        : '0 0 var(--border-radius-s, 4px) var(--border-radius-s, 4px)',
    'box-shadow': dropdownOpen.value ? 'var(--elevation-light-2)' : 'none',
  }
})

watch(searchFocused, (isFocused) => {
  dropdownOpen.value = isFocused || locatingUser.value
})

watch(locatingUser, (isLocating) => {
  dropdownOpen.value = isLocating || searchFocused.value
})

watch(searchString, (newSearch) => {
  dropdownOpen.value = newSearch.length > 0
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
  searchString.value = suggestion
  handleSearchSubmit()
  focusSearchInput()
  dropdownOpen.value = false
}

function handleSuggestionRemove(term: string) {
  removeRecentSearch(term)
  // Keep focus in the search area so the dropdown stays open for removing more.
  focusSearchInput()
}

function handleSearchKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  if (event.key === 'ArrowDown' && dropdownOpen.value && target.tagName === 'INPUT') {
    event.preventDefault()
    suggestionsRef.value?.focusFirst()
  }
}

function handleSearchFocusOut(event: FocusEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement | null
  if (!searchWrapperRef.value?.contains(relatedTarget)) {
    searchFocused.value = false
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
    ref="searchWrapperRef"
    class="location-search-wrapper"
    @keydown="handleSearchKeydown"
    @focusout="handleSearchFocusOut"
    @focusin="handleSearchFocusIn"
    @input="handleSearchInput"
  >
    <Search
      v-model="searchString"
      :placeholder="searchPlaceholder"
      :elevated="elevated"
      :shape="searchShape || (elevated ? 'pill' : 'rectangle')"
      @search="handleSearchSubmit"
    />

    <SearchSuggestions
      v-if="dropdownOpen"
      ref="suggestionsRef"
      v-model:locating-user="locatingUser"
      :search-focused="searchFocused"
      :suggestions="searchSuggestions"
      :history="recentSearches"
      :heading="t('pinboard.recentSearches')"
      :show-geolocate="showGeolocate"
      :remove-label="t('pinboard.removeRecentSearch')"
      :style="cornerShape"
      @select="handleSuggestionSelect"
      @remove="handleSuggestionRemove"
    >
      <template v-if="slots['suggestion-card']" #suggestion-card>
        <slot name="suggestion-card" />
      </template>
    </SearchSuggestions>
    <slot name="no-results" />
  </div>
</template>

<style scoped>
.location-search-wrapper {
  position: relative;
}
</style>
