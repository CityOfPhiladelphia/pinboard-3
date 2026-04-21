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
} from '../types'

// props
const props = defineProps<{
  locations: BasicLocation[]
  locationSearch?: string
  locationFilter?: LocationFilterOption[]
  locationSort?: SortLocationsOptions
  hoveredId?: string | null
  selectedId?: string | null
  locationCardSlot?: (props: {
    location: BasicLocation
    isHovered: boolean
    isSelected: boolean
  }) => unknown
}>()

// emits
const emit = defineEmits<{
  select: [location: BasicLocation]
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

function handleSearchSubmit(searchString: string) {
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
    :searchPlaceholder="locationSearch"
    :filterOptions="locationFilter"
    :sortOptions="locationSort"
    @selected-filter="handleFilterChange"
    @sort-option="handleSortChange"
    @search-string="handleSearchSubmit"
  />
  <div ref="listRef" class="location-list content">
    <MapCard
      v-for="location in locations"
      :key="location.id"
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
  </div>
</template>

<style scoped>
.location-list {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  scrollbar-width: none;
}

.location-card {
  cursor: pointer;
  flex-shrink: 0;
}

.location-card--hovered {
  background-color: var(--Schemes-Surface-Container-Low, #f5f5f5);
  outline: 2px solid var(--Schemes-Primary, #1976d2);
}

.location-card--selected {
  background-color: var(--Schemes-Surface-Container, #eee);
  outline: 2px solid var(--Schemes-Primary, #1976d2);
}
</style>
