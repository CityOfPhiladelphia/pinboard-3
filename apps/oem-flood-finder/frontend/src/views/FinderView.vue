<script setup lang="ts">
import {
  Pinboard,
  MapMarker,
  MapIconTextPin,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle
} from '@pinboard/ui'
import { faGauge, faCamera } from '@fortawesome/free-solid-svg-icons'
import { useLocations } from '../composables/useLocations'
import type { Filters } from '../types'
import type { Location, LocationFilterOption } from '@ui/types'
import LocationDetail from '../components/LocationDetail.vue'
import { computed, ref } from 'vue'
import { fetchReadings } from '@/composables/useApi'

const { locations, isLoading, errorMessage } = useLocations()

const locationMode = ref<Filters>('all')

const filteredLocations = computed(() => {
  if (isLoading.value || errorMessage.value) { return [] }
  switch (locationMode.value) {
    case ('gauges'): {
      return locations.value.filter(loc => isGauge(loc))
    }
    case ('cameras'): {
      return locations.value.filter(loc => loc.other.kind === 'Camera')
    }
    default: {
      return locations.value
    }
  }
})

function isGauge(loc: Location): boolean {
  return loc.other.kind === 'Aware' || loc.other.kind === 'Usgs'
}

const filterOptions: LocationFilterOption[] = [
  { value: 'all' satisfies Filters, label: 'All' },
  { value: 'gauges' satisfies Filters, label: 'Gauge' },
  { value: 'cameras' satisfies Filters, label: 'Camera' },
]

function handleLocationFilterChange(selectedFilter: string) {
  locationMode.value = selectedFilter as Filters
}

</script>

<template>

  <Pinboard :locations="filteredLocations" :get-card-details="(loc: Location) => {

    // fetchReadings(loc.id, loc.)

    return {
      heading: loc.name,
      subheader: '0.8 mi',
      tag: '0.9 in',
      src: 'https://images.flashflood.info:8282/352753093609236/352753093609236_00806_2026-04-01_115739.jpg',
      isLoading: isLoading
    }
  }" :get-position="(loc: Location): [number, number] => [loc.longitude, loc.latitude]" :is-loading="isLoading"
    :error-message="errorMessage" :locationFilter="filterOptions" search="Search by address or keyword"
    @selected-filter="handleLocationFilterChange">

    <template #location-detail="{ location }">
      <LocationDetail :location="location" />
    </template>

    <template #map-content="{ hoveredId, selectedId, zoom, onHover, onHoverEnd, onSelect }">

      <MapNavigationControl position="bottom-right" />
      <GeolocationButton position="bottom-right" />
      <BasemapToggle position="top-right" />

      <div v-if="!isLoading">
        <MapMarker v-for="loc in filteredLocations" :key="loc.id" :lng-lat="[loc.longitude, loc.latitude]">
          <MapIconTextPin :zoom="zoom" :icon="isGauge(loc) ? faGauge : faCamera"
            :color-theme="isGauge(loc) ? 'dark-primary' : 'dark-error'" :hovered="hoveredId === loc.id"
            :selected="selectedId === loc.id" @mouseenter="onHover(loc.id)" @mouseleave="onHoverEnd()"
            @click="onSelect(loc)" />

        </MapMarker>
      </div>
    </template>

  </Pinboard>

</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
