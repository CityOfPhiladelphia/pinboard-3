<script setup lang="ts">
// vue imports
import { computed, ref } from 'vue'

// 3rd party imports
import { faGauge, faCamera } from '@fortawesome/free-solid-svg-icons'

// philly ui imports
// pinboard imports
import {
  Pinboard,
  MapMarker,
  MapIconTextPin,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle,
} from '@pinboard/ui'
import type { LatLon, LocationFilterOption } from '@ui/types'

// app imports
import LocationDetail from '@/components/LocationDetail.vue'
import { useLocations } from '@/composables/useLocations'
import type { Filters, OemLocation } from '@/types'
import type { SortLocationsOptions } from '@ui/types'

// app variables
const searchPlaceholderText = 'Search by address or keyword...'
const filterOptions: LocationFilterOption[] = [
  { value: 'all' satisfies Filters, label: 'All' },
  { value: 'gauges' satisfies Filters, label: 'Gauge' },
  { value: 'cameras' satisfies Filters, label: 'Camera' },
]
const sortLocationsOptionsAlphaOnly: SortLocationsOptions = {
  AlphaAsc: 'Alpha-Asc',
  AlphaDes: 'Alpha-Des',
}
const sortLocationsOptionsAlphaDist: SortLocationsOptions = {
  ...sortLocationsOptionsAlphaOnly,
  DistAsc: 'Dist-Asc',
  DistDes: 'Dist-Des',
}

// refs
const { oemLocations, currentLocation, isLoading, errorMessage } = useLocations()
const locationSearchString = ref<string>('')
const locationFilterMode = ref<Filters>('all')
const locationSortMode = ref<string>('')
const visitedIds = ref(new Set<string>())

// conputed refs
const sortLocationsOptions = computed(() => {
  return currentLocation.value ? sortLocationsOptionsAlphaDist : sortLocationsOptionsAlphaOnly
})
const filteredLocations = computed(() => {
  if (isLoading.value || errorMessage.value || !oemLocations.value) {
    return []
  }
  switch (locationFilterMode.value) {
    case 'gauges': {
      return oemLocations.value.filter((loc) => isGauge(loc))
    }
    case 'cameras': {
      return oemLocations.value.filter((loc) => loc.deviceType === 'Camera')
    }
    case 'all':
    default: {
      return oemLocations.value
    }
  }
})

const searchMatchedLocations = computed(() => {
  if (isLoading.value || errorMessage.value) {
    return []
  }
  if (locationSearchString.value) {
    const searchTerms = locationSearchString.value.replace(/\W+/, ' ').toLowerCase().split(' ')
    return filteredLocations.value.filter((loc) => {
      const locString = JSON.stringify(Object.values(loc)).toLowerCase()
      return searchTerms.some((term) => locString.match(term))
    })
  } else {
    return filteredLocations.value
  }
})

const filteredAndSortedLocations = computed(() => {
  if (isLoading.value || errorMessage.value) {
    return []
  }
  const locs: OemLocation[] = [...searchMatchedLocations.value]
  switch (locationSortMode.value) {
    case 'AlphaAsc': {
      return locs.sort((a, b) => a.name.localeCompare(b.name))
    }
    case 'AlphaDes': {
      return locs.sort((a, b) => b.name.localeCompare(a.name))
    }
    case 'DistAsc': {
      return locs.sort(
        (a, b) =>
          Number(a.locationCardInfo.subheader?.replace(' mi', '')) -
          Number(b.locationCardInfo.subheader?.replace(' mi', '')),
      )
    }
    case 'DistDes': {
      return locs.sort(
        (a, b) =>
          Number(b.locationCardInfo.subheader?.replace(' mi', '')) -
          Number(a.locationCardInfo.subheader?.replace(' mi', '')),
      )
    }
    default: {
      return locs
    }
  }
})

// event handlers
function handleLocationFilterChange(selectedFilter: string) {
  locationFilterMode.value = selectedFilter as Filters
}

function handleLocationSortChange(sortLocationsOption: string) {
  locationSortMode.value = sortLocationsOption
}

function handleLocationSearchSubmit(locationsSearchString: string) {
  locationSearchString.value = locationsSearchString
}

function handleGeolocate(locationData: LatLon & { accuracy: number }) {
  console.log('Geolocation Accuracy: ', locationData.accuracy)
  currentLocation.value = {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
  }
}

function handleGeolocateError(error: Error | GeolocationPositionError) {
  console.log(error)
}

function handleSelect(loc: OemLocation, onSelect: (loc: OemLocation) => void) {
  onSelect(loc)
}

function handleDeselect(id: string) {
  visitedIds.value.add(id)
}

// utility functions
function isGauge(loc: OemLocation): boolean {
  return loc.deviceType === 'Aware' || loc.deviceType === 'Usgs'
}
</script>

<template>
  <Pinboard
    :locations="filteredAndSortedLocations"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :location-panel-search="searchPlaceholderText"
    :location-panel-filter="filterOptions"
    :location-panel-sort="sortLocationsOptions"
    @location-search-string="handleLocationSearchSubmit"
    @selected-locations-filter="handleLocationFilterChange"
    @sort-locations-option="handleLocationSortChange"
    @deselect="handleDeselect"
  >
    <template #location-detail="{ location }">
      <LocationDetail :location="location" />
    </template>

    <template
      #map-content="{
        hoveredId,
        selectedId,
        zoom,
        isMobile,
        mobileControlsTarget,
        onHover,
        onHoverEnd,
        onSelect,
      }"
    >
      <MapNavigationControl v-if="!isMobile" position="bottom-right" />
      <BasemapToggle
        position="top-right"
        :teleport-to="isMobile ? mobileControlsTarget : undefined"
      />
      <GeolocationButton
        :position="isMobile ? 'top-right' : 'bottom-right'"
        :teleport-to="isMobile ? mobileControlsTarget : undefined"
        @located="handleGeolocate"
        @error="handleGeolocateError"
      />

      <div v-if="!isLoading">
        <MapMarker
          v-for="loc in [...filteredAndSortedLocations].sort((a, b) => b.latitude - a.latitude)"
          :key="loc.id"
          :lng-lat="[loc.longitude, loc.latitude]"
        >
          <MapIconTextPin
            :zoom="zoom"
            :icon="isGauge(loc) ? faGauge : faCamera"
            :text="
              loc.locationCardInfo.tags?.[1]?.text !== 'No data'
                ? loc.locationCardInfo.tags?.[1]?.text
                : undefined
            "
            :color-theme="'dark-primary'"
            :color="isGauge(loc) ? undefined : '#3053B6'"
            :hovered="hoveredId === loc.id"
            :selected="selectedId === loc.id"
            :visited="visitedIds.has(loc.id)"
            @mouseenter="onHover(loc.id)"
            @mouseleave="onHoverEnd()"
            @click="handleSelect(loc, onSelect)"
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
