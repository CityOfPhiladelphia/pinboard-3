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
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// 3rd party imports
// philly ui imports
import { FilterChipGroup } from '@phila/phila-ui-filter-chip'

// pinboard component imports
import LocationFilter from './LocationFilter.vue'
import SortPanel from './SortPanel.vue'
import LocationSearch from './LocationSearch.vue'

// type imports
import type {
  LocationFilterOption,
  SortLocationsOptions,
  SortMode,
  UserLocationState,
} from '../types'
import type { FilterProps, FilterValue } from '@phila/phila-ui-filter-chip'

// models
const locationFilterMode = defineModel<string | undefined>('location-filter-mode', {
  default: undefined,
})
const locationSortMode = defineModel<SortMode>('location-sort-mode', { default: '' })
const searchString = defineModel<string>('search-string', { default: '' })
const filterValues = defineModel<FilterValue | undefined>('filter-values', { default: undefined })
const allFiltersOpen = defineModel<boolean>('all-filters-open', { default: false })
const userLocationState = defineModel<UserLocationState>('user-location-state', {
  default: 'unknown',
})

// props
const props = defineProps<{
  searchPlaceholder: string | undefined
  filterOptions: LocationFilterOption[] | undefined
  sortOptions: SortLocationsOptions | undefined
  filters?: FilterProps[]
  isMobile: boolean
}>()

// emits
const emit = defineEmits<{
  search: []
  selectedFilter: [filter: string]
  sortOption: [sort: SortMode]
}>()

const { t } = useI18n()

// refs
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
    ...rest.filter((f) => isActive(f.name)),
    ...rest.filter((f) => !isActive(f.name)),
  ].map((f) => f.name)
}

// Map the snapshot order onto the current filter definitions, so locale/label
// changes still flow through while the order stays put. Any filter not yet in the
// snapshot falls back to source order at the end.
const orderedChipFilters = computed(() => {
  const all = props.filters ?? []
  if (!chipOrderKeys.value.length) return all
  const byKey = new Map(all.map((f) => [f.name, f]))
  const ordered = chipOrderKeys.value.map((k) => byKey.get(k)).filter((f): f is FilterProps => !!f)
  const known = new Set(chipOrderKeys.value)
  return [...ordered, ...all.filter((f) => !known.has(f.name))]
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
</script>

<template>
  <div class="location-search-filter-sort">
    <Teleport to="#mobile-map-search-filter" :disabled="!isMobile">
      <LocationSearch
        v-model:search-string="searchString"
        v-model:user-location-state="userLocationState"
        :search-placeholder="searchPlaceholder"
        :is-mobile="isMobile"
        @search="emit('search')"
      />
      <LocationFilter
        v-if="filterOptions && !filterValues"
        v-model:location-filter-mode="locationFilterMode"
        class="location-filters"
        :class="{ mobile: isMobile }"
        :filter-options="filterOptions"
      />

      <div v-else-if="filters" :class="isMobile ? 'filter-chip-bar-mobile' : 'filter-chip-bar'">
        <FilterChipGroup
          v-model="filterValues"
          :filters="orderedChipFilters"
          :label="t('pinboard.allFilters')"
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
      <div v-if="sortOptions && !filterValues" class="location-sort">
        <SortPanel
          v-model:location-sort-mode="locationSortMode"
          :sort-options="sortOptions"
          :user-location-state="userLocationState"
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
  grid-template-rows: auto auto;
  row-gap: var(--spacing-m, 1rem);
  padding: var(--spacing-l, 1.5rem) var(--spacing-m, 1rem);
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
  z-index: -1;
}

.filter-chip-bar {
  grid-area: filters;
  z-index: -1;
  height: fit-content;
  overflow-x: auto;
}

.filter-chip-bar-mobile {
  padding: 0.5rem 0;
}
</style>
