<!-- LocationSearchFilterPanel -->
<!--
Component for rendering the features search bar, filter buttons, and sort buttons inside of location panel.
Because not all finders will use the exact some layout, search, filter and sort are all optional.
Search, filter, and sort will only render if a prop for them is passed into LocationSearchFilterPanel

Features in component have minimal state and logic.
They will emit current values, and the logic for handling those values will be done in the parent app.

To render a feature:
  Search: string - placeholder string to render inside search bar
  Filter: string[] - array of string to match
  Sort: SortLocationsOptions - Object that will be converted into MenuOption[]
 -->

<script setup lang="ts">
// vue imports
import { ref, computed } from 'vue'

// 3rd party imports
// philly ui imports
import { Search } from '@phila/phila-ui-search'

// pinboard component imports
import LocationFilter from './LocationFilter.vue'
import SortPanel, { type SortPanelOption } from './SortPanel.vue'
import SearchSuggestions from './SearchSuggestions.vue'

// pinboard composables imports
import { useSearchSuggestions } from '../composables/useSearchSuggestions'

// type imports
import type { LocationFilterOption, SortLocationsOptions } from '../types'

// props
const props = defineProps<{
  searchPlaceholder?: string
  filterOptions?: LocationFilterOption[]
  sortOptions?: SortLocationsOptions
  locationAvailable?: boolean
  isMobile: boolean
}>()

// emits

const emit = defineEmits<{
  search: []
  searchString: [search: string]
  selectedFilter: [filter: string]
  sortOption: [sort: string]
}>()

// refs
const appliedSort = ref<string | null>(null)
const searchString = ref<string>('')
const searchWrapperRef = ref<HTMLElement | null>(null)
const suggestionsRef = ref<InstanceType<typeof SearchSuggestions> | null>(null)
const {
  searchSuggestions,
  dismissSuggestions,
  hideSuggestions,
  refetchSuggestions,
} = useSearchSuggestions(searchString)

// computed refs
const sortChoices = computed<SortPanelOption[]>(() => {
  const opts = props.sortOptions ?? {}
  return Object.entries(opts).map(([value, label]) => ({ value, label }))
})

// event handlers
function handleFilterChange(option: string) {
  emit('selectedFilter', option)
}

function handleSortChange(value: string | null) {
  appliedSort.value = value
  emit('sortOption', value ?? '')
}

function handleSearchChange(search: string) {
  emit('searchString', search)
  searchString.value = search
}

function handleSuggestionSelect(suggestion: string) {
  dismissSuggestions()
  searchString.value = suggestion
  emit('searchString', suggestion)
  emit('search')
  focusSearchInput()
}

function handleSearchKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  if (
    event.key === 'ArrowDown' &&
    searchSuggestions.value.length &&
    target.tagName === 'INPUT'
  ) {
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
    hideSuggestions()
  }
}

function handleSearchFocusIn(event: FocusEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement | null
  if (!searchWrapperRef.value?.contains(relatedTarget)) {
    refetchSuggestions()
  }
}

function focusSearchInput() {
  const input = searchWrapperRef.value?.querySelector<HTMLElement>('input')
  input?.focus()
}

// utility functions
</script>

<template>
  <div class="location-search-filter-sort">
    <div
      v-if="searchPlaceholder"
      ref="searchWrapperRef"
      class="location-search"
      @keydown="handleSearchKeydown"
      @focusout="handleSearchFocusOut"
      @focusin="handleSearchFocusIn"
    >
      <Search
        v-model="searchString"
        :placeholder="searchPlaceholder"
        @update:model-value="handleSearchChange"
        @search="emit('search')"
      />
      <SearchSuggestions
        ref="suggestionsRef"
        :suggestions="searchSuggestions"
        @select="handleSuggestionSelect"
        @dismiss="handleSuggestionDismiss"
      />
    </div>
    <LocationFilter
      v-if="filterOptions"
      class="location-filters"
      :filter-options="filterOptions"
      @selected-filter="handleFilterChange"
    />
    <div v-if="sortOptions" class="location-sort">
      <SortPanel
        :sort-options="sortChoices"
        :applied-sort="appliedSort"
        :location-available="locationAvailable ?? false"
        @update:applied-sort="handleSortChange"
        :is-mobile="isMobile"
      />
    </div>
  </div>
</template>

<style scoped>
.location-search-filter-sort {
  display: grid;
  grid-template-areas:
    'search search'
    'filters sort';
  grid-template-columns: 1fr auto;
}

.location-search {
  grid-area: search;
  padding: 1rem 1rem 0rem 1rem;
  width: 100%;
}

.location-search :deep(.search) {
  width: 100%;
}

.location-filters {
  grid-area: filters;
}

.location-sort {
  grid-area: sort;
  margin-left: auto;
  padding: 0.75rem 1rem;
}
</style>
