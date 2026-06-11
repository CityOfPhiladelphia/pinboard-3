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
import { ref, computed, inject } from 'vue'

// 3rd party imports
// philly ui imports
import { Search } from '@phila/phila-ui-search'

// pinboard component imports
import LocationFilter from './LocationFilter.vue'
import SortPanel, { type SortPanelOption } from './SortPanel.vue'
import SearchSuggestions from './SearchSuggestions.vue'

// pinboard composables imports
import { useSearchSuggestions } from '../composables/useSearchSuggestions'
import { PINBOARD_CONFIG_KEY } from '../plugin'

// type imports
import type { LocationFilterOption, SortLocationsOptions } from '../types'

// props
const props = defineProps<{
  searchPlaceholder?: string | undefined
  filterOptions?: LocationFilterOption[] | undefined
  sortOptions?: SortLocationsOptions | undefined
  locationAvailable?: boolean | undefined
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
const { searchSuggestions, dismissSuggestions, hideSuggestions, refetchSuggestions } =
  useSearchSuggestions(searchString)

const config = inject(PINBOARD_CONFIG_KEY)
// Elevate the floating search only when the cluster sits over the map (mobile + map placement).
const elevatedSearch = computed(() => props.isMobile && config?.mobileFilterPlacement === 'map')

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
  if (event.key === 'ArrowDown' && searchSuggestions.value.length && target.tagName === 'INPUT') {
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
    <Teleport to="#mobile-map-search-filter" :disabled="!isMobile">
      <div
        v-if="searchPlaceholder"
        ref="searchWrapperRef"
        class="location-search"
        :class="{ mobile: isMobile }"
        @keydown="handleSearchKeydown"
        @focusout="handleSearchFocusOut"
        @focusin="handleSearchFocusIn"
      >
        <Search
          v-model="searchString"
          :placeholder="searchPlaceholder"
          :elevated="elevatedSearch"
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
        :class="{ mobile: isMobile }"
        :filter-options="filterOptions"
        @selected-filter="handleFilterChange"
      />
    </Teleport>

    <Teleport to="#bottom-sheet-sort" :disabled="!isMobile">
      <div v-if="sortOptions" class="location-sort">
        <SortPanel
          :sort-options="sortChoices"
          :applied-sort="appliedSort"
          :location-available="locationAvailable ?? false"
          :is-mobile="isMobile"
          @update:applied-sort="handleSortChange"
        />
      </div>
    </Teleport>
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

/* Teleported onto the map (mobile): the container supplies the top inset, so
   keep only the 1rem side inset that aligns the search bar with the chip row. */
.location-search.mobile {
  padding: 0 1rem;
}

.location-search :deep(.search) {
  width: 100%;
}

.location-filters {
  grid-area: filters;
}

/* 19px left inset aligns the filter chips with the search input on mobile. */
.location-filters.mobile {
  padding: 0.25rem 0 0;
  padding-left: 19px;
  gap: 0.25rem;
}

.location-sort {
  grid-area: sort;
  margin-left: auto;
  padding: 0.75rem 1rem 0rem 0rem;
}
</style>
