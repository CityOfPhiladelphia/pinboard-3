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
import type { Location } from '../types'
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

const filterOptions = [
  { value: 'all' as const, label: 'All' },
  { value: 'gauges' as const, label: 'Gauge' },
  { value: 'cameras' as const, label: 'Camera' },
]

</script>

<template>

  <Pinboard
    :locations="filteredLocations"
    :get-id="(loc: Location) => loc.id"
    :is-loading="isLoading"
    :error-message="errorMessage"
  >
    <template #locations-header>
      <div class="location-filters">
        <button
          v-for="opt in filterOptions"
          :key="opt.value"
          :class="['filter-pill', { active: locationMode === opt.value }]"
          @click="locationMode = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
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

      <MapMarker
        v-if="!isLoading"
        v-for="loc in filteredLocations"
        :key="loc.id"
        :lng-lat="[loc.longitude, loc.latitude]"
      >
        <MapIconTextPin
          :zoom="zoom"
          :icon="isGauge(loc) ? faGauge : faCamera"
          :color-theme="isGauge(loc) ? 'dark-primary' : 'dark-error'"
          :hovered="hoveredId === loc.id"
          :selected="selectedId === loc.id"
          :style="
            filteredLocations.some((f) => f.id === loc.id)
              ? undefined
              : { visibility: 'hidden', pointerEvents: 'none' }
          "
          @mouseenter="onHover(loc.id)"
          @mouseleave="onHoverEnd()"
          @click="onSelect(loc)"
        />

      </MapMarker>

    </template>

  </Pinboard>

</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>

<style scoped>
.location-filters {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  flex-shrink: 0;
}

.filter-pill {
  padding: 0.375rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 1rem;
  background: #fff;
  cursor: pointer;
  font-size: 0.8125rem;
}

.filter-pill.active {
  background: var(--Schemes-Primary, #2176d2);
  border-color: var(--Schemes-Primary, #2176d2);
  color: #fff;
}
</style>
