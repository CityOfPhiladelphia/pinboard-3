<script setup lang="ts">
import {
  Pinboard,
  MapMarker,
  MapIconTextPin,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle
} from '@pinboard/ui'
import { Tags } from '@phila/phila-ui-tags'
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

function shouldShow(loc: Location): boolean {
  if (loc.name === 'TestCamera') return false
  return true
}

</script>

<template>

  <Pinboard :locations="filteredLocations" :get-card-details="(loc: Location) => ({
    heading: loc.name,
    subheader: '0.8 mi',
    tag: '0.9 in',
    src: 'https://images.flashflood.info:8282/352753093609236/352753093609236_00806_2026-04-01_115739.jpg',
    isLoading: isLoading
  })" :get-position="(loc: Location): [number, number] => [loc.longitude, loc.latitude]" :filter="shouldShow"
    :is-loading="isLoading" :error-message="errorMessage" :locationFilter="filterOptions"
    search="Search by address or keyword">

    <template #location-detail="{ location }">
      <LocationDetail :location="location" />
    </template>

    <template #map-content="{ hoveredId, selectedId, zoom, onHover, onHoverEnd, onSelect }">

      <MapNavigationControl position="bottom-right" />
      <GeolocationButton position="bottom-right" />
      <BasemapToggle position="top-right" />

      <div v-if="!isLoading">
        <MapMarker v-for="loc in locations" :key="loc.id" :lng-lat="[loc.longitude, loc.latitude]">
          <MapIconTextPin :zoom="zoom" :icon="isGauge(loc) ? faGauge : faCamera"
            :color-theme="isGauge(loc) ? 'dark-primary' : 'dark-error'" :hovered="hoveredId === loc.id"
            :selected="selectedId === loc.id" :style="shouldShow(loc) && filteredLocations.some((f) => f.id === loc.id)
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
