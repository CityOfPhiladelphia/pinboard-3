<script setup lang="ts">
import {
  Pinboard,
  MapMarker,
  MapIconTextPin,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle,
} from '@pinboard/ui'
import { faGauge, faCamera } from '@fortawesome/free-solid-svg-icons'
import { useLocations } from '@/composables/useLocations'
import type { Filters, OemLocation } from '@/types'
import type { Location, LocationFilterOption } from '@ui/types'
import { SortLocationsValues } from '../../../../../packages/ui/src/types'
import LocationDetail from '@/components/LocationDetail.vue'
import { computed, ref } from 'vue'

const { locations, isLoading, errorMessage } = useLocations()
const locationSearchString = ref<string>('')
const locationFilterMode = ref<Filters>('all')
const locationSortMode = ref<number>(SortLocationsValues.None)
const searchPlaceholderText = 'Search by address or keyword...'

const filteredLocations = computed<OemLocation[]>(() => {
  if (isLoading.value || errorMessage.value) {
    return []
  }
  return filterLocations(locations.value)
})

function filterLocations(locations: OemLocation[]) {
  switch (locationFilterMode.value) {
    case 'all': {
      const sorted = sortLocations(locations, locationSortMode.value)
      return sorted
    }
    case 'gauges': {
      const filtered = locations.filter((loc) => isGauge(loc))
      const sorted = sortLocations(filtered, locationSortMode.value)
      return sorted
    }
    case 'cameras': {
      const filtered = locations.filter((loc) => loc.other.kind === 'Camera')
      const sorted = sortLocations(filtered, locationSortMode.value)
      return sorted
    }
  }
}

function sortLocations(locations: OemLocation[], sortMode: SortLocationsValues) {
  switch (sortMode) {
    case SortLocationsValues.None: {
      return locations
    }
    case SortLocationsValues.AlphaAsc: {
      const arrayCopy = [...locations]
      return arrayCopy.sort((a, b) => {
        const aName = a.name.toLowerCase()
        const bName = b.name.toLowerCase()
        if (aName < bName) {
          return -1
        } else if (bName < aName) {
          return 1
        } else {
          return 0
        }
      })
    }
    case SortLocationsValues.AlphaDes: {
      const arrayCopy = [...locations]
      return arrayCopy.sort((a, b) => {
        const aName = a.name.toLowerCase()
        const bName = b.name.toLowerCase()
        if (aName > bName) {
          return -1
        } else if (bName > aName) {
          return 1
        } else {
          return 0
        }
      })
    }
    case SortLocationsValues.DistAsc: {
      // NEED TO IMPLEMENT ONCE THE CARD INFO IF FIXED
      return locations
    }
    case SortLocationsValues.DistDes: {
      // NEED TO IMPLEMENT ONCE THE CARD INFO IF FIXED
      return locations
    }
  }
}

function isGauge(loc: OemLocation): boolean {
  return loc.other.kind === 'Aware' || loc.other.kind === 'Usgs'
}

const filterOptions: LocationFilterOption[] = [
  { value: 'all' satisfies Filters, label: 'All' },
  { value: 'gauges' satisfies Filters, label: 'Gauge' },
  { value: 'cameras' satisfies Filters, label: 'Camera' },
]

function handleLocationFilterChange(selectedFilter: string) {
  locationFilterMode.value = selectedFilter as Filters
}

function handleLocationSortChange(sortLocationsOption: number) {
  locationSortMode.value = sortLocationsOption as SortLocationsValues
  console.log(locationSortMode.value)
}

function handleLocationSearchSubmit(locationsSearchString: string) {
  locationSearchString.value = locationsSearchString
}
</script>

<template>
  <Pinboard
    :locations="filteredLocations"
    :get-card-details="
      (loc: Location) => ({
        heading: loc.name,
        subheader: '0.8 mi',
        tag: '0.9 in',
        src: 'https://images.flashflood.info:8282/352753093609236/352753093609236_00806_2026-04-01_115739.jpg',
        isLoading: isLoading,
      })
    "
    :get-position="(loc: Location): [number, number] => [loc.longitude, loc.latitude]"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :location-panel-search="searchPlaceholderText"
    :location-panel-filter="filterOptions"
    @location-search-string="handleLocationSearchSubmit"
    @selected-locations-filter="handleLocationFilterChange"
    @sort-locations-option="handleLocationSortChange"
  >
    <template #location-detail="{ location }">
      <LocationDetail :location="location" />
    </template>

    <template #map-content="{ hoveredId, selectedId, zoom, onHover, onHoverEnd, onSelect }">
      <MapNavigationControl position="bottom-right" />
      <GeolocationButton position="bottom-right" />
      <BasemapToggle position="top-right" />

      <div v-if="!isLoading">
        <MapMarker
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
            @mouseenter="onHover(loc.id)"
            @mouseleave="onHoverEnd()"
            @click="onSelect(loc)"
          />
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
