<script setup lang="ts">
// vue imports
import { ref, watch } from 'vue'

// philly ui imports
import { MapCard } from '@phila/phila-ui-cards'

// pinboard component imports
import LocationSearchFilterPanel from './LocationSearchFilterPanel.vue'

// type imports
import type {
  BasicLocation,
  LocationFilterOption,
  SortLocationsOptions,
  UserLocationState,
} from '../types'

// props
const props = defineProps<{
  locations: BasicLocation[]
  isMobile: boolean
  hoveredId: string | undefined
  selectedId: string | undefined
  waitForUserLocation: boolean
  userLocationState: UserLocationState
  locationSearch: string | undefined
  locationFilter: LocationFilterOption[] | undefined
  locationSort: SortLocationsOptions | undefined
}>()

// emits
const emit = defineEmits<{
  select: [location: BasicLocation]
  search: []
  searchString: [search: string]
  selectedFilter: [filter: string]
  sortOption: [sort: string]
  hover: [id: string]
  'hover-end': []
}>()

// component variables

// refs
const pendingKeydown = ref(false)
const listRef = ref<HTMLElement | null>(null)
// computed refs

// watchers
watch(
  () => props.selectedId,
  (id) => {
    if (id && listRef.value) {
      // Wait for the bottom sheet's snap animation (~300ms) to settle
      // before measuring scroll position — otherwise "center" is computed
      // against the old (small) viewport and the card ends up near the
      // top of the new (large) viewport.
      setTimeout(() => scrollToCard(id), 350)
    }
  }
)
// event handlers
function handleFilterChange(selectedFilter: string) {
  emit('selectedFilter', selectedFilter)
}

function handleSortChange(sortOption: string) {
  emit('sortOption', sortOption)
}

function handleSearchChange(searchString: string) {
  emit('searchString', searchString)
}

function handleCardKeyup(location: BasicLocation) {
  if (pendingKeydown.value) {
    emit('select', location)
    pendingKeydown.value = false
  }
}

// utility functions
function scrollToCard(id: string, behavior: ScrollBehavior = 'smooth') {
  const card = listRef.value?.querySelector(`[data-location-id="${id}"]`)
  card?.scrollIntoView({ behavior, block: 'center' })
}

// expose
defineExpose({ scrollToCard })
</script>

<template>
  <LocationSearchFilterPanel
    v-if="locationSearch || locationFilter || locationSort"
    :search-placeholder="locationSearch"
    :filter-options="locationFilter"
    :sort-options="locationSort"
    :user-location-state="props.userLocationState"
    :is-mobile="isMobile"
    @selected-filter="handleFilterChange"
    @sort-option="handleSortChange"
    @search-string="handleSearchChange"
    @search="emit('search')"
  />

  <slot name="below-search" />

  <div
    v-if="waitForUserLocation && userLocationState === 'acquiring'"
    ref="listRef"
    class="location-list"
  >
    <MapCard
      v-for="n in 5"
      :key="n"
      :is-loading="true"
      :style="{ display: isMobile ? 'none' : 'block' }"
    />
  </div>

  <div v-else ref="listRef" class="location-list">
    <template v-for="location in locations" :key="location.id">
      <div
        v-if="$slots['location-card']"
        :data-location-id="location.id"
        :class="[
          'location-card',
          'location-card--custom',
          {
            'location-card--hovered': hoveredId === location.id,
            'location-card--selected': selectedId === location.id,
          },
        ]"
        tabindex="0"
        @click="emit('select', location)"
        @mouseenter="emit('hover', location.id)"
        @mouseleave="emit('hover-end')"
        @keydown.enter="pendingKeydown = true"
        @keyup.enter="handleCardKeyup(location)"
      >
        <slot name="location-card" :location="location" />
      </div>
      <MapCard
        v-else
        :data-location-id="location.id"
        v-bind="location.locationCardInfo"
        :class="[
          'location-card',
          {
            'location-card--hovered': hoveredId === location.id,
            'location-card--selected': selectedId === location.id,
          },
        ]"
        tabindex="0"
        @click="emit('select', location)"
        @mouseenter="emit('hover', location.id)"
        @mouseleave="emit('hover-end')"
        @keydown.enter="pendingKeydown = true"
        @keyup.enter="handleCardKeyup(location)"
      />
    </template>
  </div>
</template>

<style scoped>
.location-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  gap: 0.75rem;
  padding: 0.5rem 1rem 1rem 1rem;
  scrollbar-width: none;
}

.location-card {
  cursor: pointer;
  flex-shrink: 0;
}

.location-card--custom {
  border: 1px solid var(--Schemes-Border, #a9a9a9);
  border-radius: var(--scale-200);
  background-color: var(--Schemes-On-Primary, #fff);
  overflow: hidden;
}

.location-card--hovered {
  background-color: var(--Schemes-Surface-Container-Low, #f5f5f5);
  outline: 2px solid var(--Schemes-Primary, #1976d2);
}

.location-card--selected {
  background-color: var(--Schemes-Surface-Container, #eee);
  outline: 2px solid var(--Schemes-Primary, #1976d2);
}

@media (max-width: 768px) {
  .location-list {
    padding-top: 1rem;
  }
}
</style>
