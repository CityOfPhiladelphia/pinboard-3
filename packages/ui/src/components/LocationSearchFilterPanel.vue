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
import { useI18n } from 'vue-i18n'

// 3rd party imports
// philly ui imports
import { Search } from '@phila/phila-ui-search'

// pinboard component imports
import LocationFilter from './LocationFilter.vue'
import SortPanel, { type SortPanelOption } from './SortPanel.vue'
import SearchSuggestions from './SearchSuggestions.vue'

// pinboard composables imports
import { useSearchSuggestions } from '../composables/useSearchSuggestions'
import { useRecentSearches } from '../composables/useRecentSearches'
import { PINBOARD_CONFIG_KEY } from '../plugin'

// type imports
import type { LocationFilterOption, SortLocationsOptions, UserLocationState } from '../types'

// props
const props = defineProps<{
  searchPlaceholder: string | undefined
  filterOptions: LocationFilterOption[] | undefined
  sortOptions: SortLocationsOptions | undefined
  userLocationState: UserLocationState
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

const { t } = useI18n()
const {
  recentSearches,
  add: addRecentSearch,
  remove: removeRecentSearch,
} = useRecentSearches(config?.appId)
const searchFocused = ref(false)

// Empty field → recent searches; typing → AIS autocomplete.
const dropdownSuggestions = computed(() => {
  if (!searchFocused.value) return []
  return searchString.value ? searchSuggestions.value : recentSearches.value
})
const showingRecents = computed(() => !searchString.value)

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

function submitSearch() {
  const term = searchString.value.trim()
  if (term) {
    addRecentSearch(term)
    if (term !== searchString.value) {
      searchString.value = term
      emit('searchString', term)
    }
  }
  emit('search')
}

function handleSuggestionSelect(suggestion: string) {
  dismissSuggestions()
  searchString.value = suggestion
  emit('searchString', suggestion)
  submitSearch()
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
          @search="submitSearch"
        />
        <SearchSuggestions
          ref="suggestionsRef"
          :suggestions="dropdownSuggestions"
          :heading="showingRecents ? t('pinboard.recentSearches') : undefined"
          :removable="showingRecents"
          :remove-label="t('pinboard.removeRecentSearch')"
          @select="handleSuggestionSelect"
          @dismiss="handleSuggestionDismiss"
          @remove="handleSuggestionRemove"
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
          :user-location-state="props.userLocationState"
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
  padding: 1rem 0.9rem 0.25rem 0.9rem;
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
  padding: 0rem 0rem 0rem 1rem;
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
  padding: 0rem 1rem 1.25rem 0rem;
}

@media (max-width: 768px) {
  .location-search {
    padding: 0.6rem 1.5rem 0.25rem 1.5rem;
  }

  .location-filters {
    padding: 0rem 0rem 0rem 1.6rem;
  }

  .location-search :deep(.state-layer) {
    padding-top: 0;
    padding-bottom: 0;
  }

  .location-search :deep(.phila-text-field) {
    padding: 0 var(--scale-small, 0.5rem);
  }
}
</style>
