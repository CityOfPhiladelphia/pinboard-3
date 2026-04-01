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
import type { Location, LocationFilterOption } from '@ui/types'
import LocationDetail from '../components/LocationDetail.vue'
import { computed, ref } from 'vue'

const { locations, isLoading, errorMessage } = useLocations()

const locationMode = ref<'all' | 'gauges' | 'cameras'>('all')

const filteredLocations = computed(() => {
  if (!isLoading.value && errorMessage.value === null) {
    const sortedLocations: Location[] = [...locations.value].sort((a, b) => b.latitude - a.latitude)

    if (locationMode.value === 'all') {
      return sortedLocations
    }

    if (locationMode.value === 'gauges') {
      return sortedLocations.filter(loc =>
        loc.other.kind === 'Aware' ||
        loc.other.kind === 'Usgs'
      )
    }

    if (locationMode.value === 'cameras') {
      return sortedLocations.filter(loc =>
        loc.other.kind === 'Camera'
      )
    }
  }
  return []
})

function isGauge(loc: Location): boolean {
  return loc.other.kind === 'Aware' || loc.other.kind === 'Usgs'
}

const filterOptions: LocationFilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'gauges', label: 'Gauge' },
  { value: 'cameras', label: 'Camera' },
]

</script>

<template>

  <Pinboard :locations="filteredLocations" :get-id="(loc: Location) => loc.id" :is-loading="isLoading"
    :error-message="errorMessage" :locationFilter="filterOptions" search="Search by address or keyword">
    <template #locations-header>

    </template>

    <template #location-card="{ location }">
      {{ location.name }}
    </template>

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
            :selected="selectedId === loc.id" :style="filteredLocations.some((f) => f.id === loc.id)
              ? undefined
              : { visibility: 'hidden', pointerEvents: 'none' }
              " @mouseenter="onHover(loc.id)" @mouseleave="onHoverEnd()" @click="onSelect(loc)" />

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
