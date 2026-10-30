<script setup lang="ts">
// vue imports
import { ref, computed, inject, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// philly ui imports
import { Search } from '@phila/phila-ui-search'

// pinboard component imports
import SearchSuggestions from './SearchSuggestions.vue'

// pinboard composables imports
import { useSearchSuggestions } from '../composables/useSearchSuggestions.ts'
import { useRecentSearches } from '../composables/useRecentSearches.ts'
import { PINBOARD_CONFIG_KEY } from '../keys.ts'

// models
const searchString = defineModel<string>('searchString', { default: '' })
const dropdownOpen = defineModel<boolean>('dropdownOpen', {
  default: false,
})
const locatingUser = defineModel<boolean>('locatingUser', {
  default: false,
})

// props
const props = withDefaults(
  defineProps<{
    searchPlaceholder: string | undefined
    elevated?: boolean
    searchShape?: 'rectangle' | 'pill'
    showGeolocate?: boolean
    aisClientId?: string
  }>(),
  {
    elevated: false,
    searchShape: 'rectangle',
    showGeolocate: false,
    aisClientId: undefined,
  }
)

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
const { searchSuggestions, refetchSuggestions } = useSearchSuggestions(
  searchString,
  props.aisClientId
)
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

watch(
  [searchFocused, locatingUser, searchSuggestions, recentSearches],
  ([isFocused, isLocating, newSuggestions, newRecent]) => {
    dropdownOpen.value =
      (isFocused || isLocating) && (newSuggestions.length > 0 || newRecent.length > 0)
  }
)

// event handlers
function handleSearchInput(event: InputEvent) {
  // v-model does not update while an IME is composing, and Android predictive text
  // composes ordinary words — so searchString would sit stale until the keyboard
  // closed, and the suggestions never fetched. Read the value off the DOM instead.
  // Vue skips writing back to the input while composing, so the IME is unaffected.
  const target = event.target as HTMLInputElement
  if (target.tagName === 'INPUT') searchString.value = target.value
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
  switch (event.key) {
    case 'ArrowDown': {
      if (dropdownOpen.value && target.tagName === 'INPUT') {
        event.preventDefault()
        suggestionsRef.value?.focusFirst()
      }
      break
    }
    case 'Escape': {
      dropdownOpen.value = false
      break
    }
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
      :aria-expanded="dropdownOpen"
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
