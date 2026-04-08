<script setup lang="ts">
import { ref } from 'vue'
import { Search } from '@phila/phila-ui-search'
import { MapCard } from '@phila/phila-ui-cards'
import type { MapCardProps } from '@phila/phila-ui-cards'
import LocationSearchFilterPanel from './LocationSearchFilterPanel.vue'
import type { Location, LocationFilterOption } from '../types'

defineProps<{
  locationFilter: LocationFilterOption[] | null
  search: string | null
  locations: Location[]
  hoveredId?: string | null
  selectedId?: string | null
  locationCardSlot?: (props: {
    location: Location
    isHovered: boolean
    isSelected: boolean
  }) => unknown
  getCardDetails: (loc: Location) => MapCardProps
}>()

const emit = defineEmits<{
  select: [location: Location]
  selectedFilter: [filter: string]
  hover: [id: string]
  'hover-end': []
}>()

const pendingKeydown = ref(false)

function onCardKeyup(location: Location) {
  if (pendingKeydown.value) {
    emit('select', location)
    pendingKeydown.value = false
  }
}

function handleFilterChange(selectedFilter: string) {
  emit('selectedFilter', selectedFilter)
}
</script>

<template>
  <LocationSearchFilterPanel
    v-if="locationFilter"
    :filterOptions="locationFilter"
    @selected-filter="handleFilterChange"
  />
  <Search v-if="search" class-name="location-search" :placeholder="search" />
  <div class="location-list content">
    <MapCard
      v-for="location in locations"
      :key="location.id"
      v-bind="getCardDetails(location)"
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
      @keyup.enter="onCardKeyup(location)"
    />
  </div>
</template>

<style scoped>
.location-list {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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

.location-search {
  padding: 1rem;
  width: 100%;
}
</style>
