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
import { ref, computed, inject, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// 3rd party imports
// philly ui imports
import { Search } from '@phila/phila-ui-search'
import { FilterChipGroup } from '@phila/phila-ui-filter-chip'

// pinboard component imports
import LocationFilter from './LocationFilter.vue'
import SortPanel from './SortPanel.vue'
import SearchSuggestions from './SearchSuggestions.vue'

// pinboard composables imports
import { useSearchSuggestions } from '../composables/useSearchSuggestions'
import { useRecentSearches } from '../composables/useRecentSearches'
import { PINBOARD_CONFIG_KEY } from '../keys.ts'

// type imports
import type {
  LocationFilterOption,
  SortLocationsOptions,
  SortMode,
  UserLocationState,
} from '../types'
import type { FilterDefinition, FilterValues } from '@phila/phila-ui-core'

// models
const locationFilterMode = defineModel<string | undefined>('location-filter-mode', {
  default: undefined,
})
const locationSortMode = defineModel<SortMode>('location-sort-mode', { default: '' })
const searchString = defineModel<string>('search-string', { default: '' })
const filterValues = defineModel<FilterValues | undefined>('filter-values', { default: undefined })
const allFiltersOpen = defineModel<boolean>('all-filters-open', { default: false })

// props
const props = defineProps<{
  searchPlaceholder: string | undefined
  filterOptions: LocationFilterOption[] | undefined
  sortOptions: SortLocationsOptions | undefined
  userLocationState: UserLocationState
  filters?: FilterDefinition[]
  isMobile: boolean
}>()

// emits
const emit = defineEmits<{
  search: []
  selectedFilter: [filter: string]
  sortOption: [sort: SortMode]
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

// Filter chips in use bubble up to sit right after the (pinned) Sort chip. The
// order is a snapshot recomputed only at safe moments — initial load, a chip's
// dropdown closing, and the All-Filters panel closing — never live while a
// dropdown is open, so a chip never moves out from under its own popover.
const chipOrderKeys = ref<string[]>([])

function recomputeChipOrder() {
  const all = props.filters ?? []
  const values = filterValues.value ?? {}
  const isActive = (key: string) => {
    const v = values[key]
    return v && typeof v === 'object' ? Object.values(v).some(Boolean) : v === true
  }
  const pinned = all.filter((f) => f.excludeFromCount)
  const rest = all.filter((f) => !f.excludeFromCount)
  chipOrderKeys.value = [
    ...pinned,
    ...rest.filter((f) => isActive(f.key)),
    ...rest.filter((f) => !isActive(f.key)),
  ].map((f) => f.key)
}

// Map the snapshot order onto the current filter definitions, so locale/label
// changes still flow through while the order stays put. Any filter not yet in the
// snapshot falls back to source order at the end.
const orderedChipFilters = computed(() => {
  const all = props.filters ?? []
  if (!chipOrderKeys.value.length) return all
  const byKey = new Map(all.map((f) => [f.key, f]))
  const ordered = chipOrderKeys.value
    .map((k) => byKey.get(k))
    .filter((f): f is FilterDefinition => !!f)
  const known = new Set(chipOrderKeys.value)
  return [...ordered, ...all.filter((f) => !known.has(f.key))]
})

// Seed on load and refresh on locale (filters) changes. Otherwise the order only
// updates on dropdown-close / panel-close (wired in the template + watcher below).
watch(
  () => props.filters,
  () => recomputeChipOrder(),
  { immediate: true }
)

// Defensive: enforce the "one left panel at a time" invariant in state. Not
// reachable in the current UI (an open detail overlay covers the Filters
// button), but keeps the invariant if the structural cleanup (bead
// pinboard-3-nag) later makes filters reachable with a detail open. Desktop
// only: on mobile the filter panel is full-screen and leaving the detail in
// state returns the user to it when the filters close.
watch(allFiltersOpen, (open) => {
  // Reorder chips to reflect what was toggled in the panel, once it's closed.
  if (!open) recomputeChipOrder()
})

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
        @input="handleSearchInput"
      >
        <Search
          v-model="searchString"
          class="location-search-input"
          :placeholder="searchPlaceholder"
          :elevated="elevatedSearch"
          @search="handleSearchSubmit"
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
        v-if="filterOptions && !filterValues"
        v-model:location-filter-mode="locationFilterMode"
        class="location-filters"
        :class="{ mobile: isMobile }"
        :filter-options="filterOptions"
      />

      <div v-if="filters" :class="isMobile ? 'filter-chip-bar-mobile' : 'filter-chip-bar'">
        <FilterChipGroup
          v-model="filterValues"
          :filters="orderedChipFilters"
          color="white"
          filter-button
          :filter-button-text="t('pinboard.filters')"
          :reset-text="t('pinboard.reset')"
          :elevated="isMobile"
          @open-filters="allFiltersOpen = true"
          @dropdown-close="recomputeChipOrder"
        />
      </div>
    </Teleport>

    <Teleport to="#bottom-sheet-sort" :disabled="!isMobile">
      <div v-if="sortOptions && !filterValues" class="location-sort content">
        <SortPanel
          v-model:location-sort-mode="locationSortMode"
          :sort-options="sortOptions"
          :user-location-state="props.userLocationState"
          :is-mobile="isMobile"
        />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.location-search-filter-sort {
  isolation: isolate;
  display: grid;
  grid-template-areas:
    'search search'
    'filters sort';
  grid-template-columns: 1fr auto;
  row-gap: var(--spacing-m, 1rem);
  padding: var(--spacing-l, 1.5rem) var(--spacing-m, 1rem);
}

.location-search {
  grid-area: search;
}

.location-search-input {
  position: relative;
}

/* Teleported onto the map (mobile): the container supplies the top inset, so
   keep only the 1rem side inset that aligns the search bar with the chip row. */
.location-search.mobile {
  padding: 0 1rem;
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
}

.filter-chip-bar {
  grid-area: filters;
  z-index: -1;
  overflow-x: auto;
}

.filter-chip-bar :is(.phila-filter-chip-group__row) {
  padding-inline: 0;
  padding-block: 0;
}

.filter-chip-bar-mobile {
  padding: 0.5rem 0;
}
</style>
