<script setup lang="ts">
// vue imports
import { computed, ref, watch } from 'vue'

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
import { useSearchAddress, useSearchZipcode } from '@ui/composables/_index'
import { hasLocationData, StreetAddress, StreetIntersection, Zipcode } from '@ui/utilities/_index'
import type { LatLon, SearchMode, LocationFilterOption, SortLocationsOptions } from '@ui/types'
import { filterLocations, isGauge, searchLocations, sortLocations } from '@/utilities/_index'

// app imports
import LocationDetail from '@/components/LocationDetail.vue'
import { useLocations } from '@/composables/useLocations'
import type { Filters, OemLocation, SortMode } from '@/types'

// app variables
const searchPlaceholderText = 'Search by address or keyword...'
const filterOptions: LocationFilterOption[] = [
  { value: 'all' satisfies Filters, label: 'All' },
  { value: 'gauges' satisfies Filters, label: 'Gauge' },
  { value: 'cameras' satisfies Filters, label: 'Camera' },
]
const sortLocationsOptionsAlpha: SortLocationsOptions = {
  AlphaAsc: 'Alpha-Asc',
  AlphaDes: 'Alpha-Des',
}

const sortLocationsOptionsDist: SortLocationsOptions = {
  DistAsc: 'Dist-Asc',
  DistDes: 'Dist-Des',
}

const sortLocationsOptionsAll: SortLocationsOptions = {
  ...sortLocationsOptionsAlpha,
  ...sortLocationsOptionsDist,
}

// refs
const addressForSearch = ref<string>('')
const { addressCoordinates } = useSearchAddress(addressForSearch)
const zipcodeForSearch = ref<string>('')
const { zipcodePolygon } = useSearchZipcode(zipcodeForSearch)
const keywordsForSearch = ref<string>('')
const locationSearchMode = ref<SearchMode>(false)
const locationFilterMode = ref<Filters>('all')
const visitedIds = ref(new Set<string>())
const { oemLocations, userLocation, isLoading, errorMessage } = useLocations()
const locationSortMode = ref<SortMode>(hasLocationData(userLocation) ? 'DistAsc' : '')

// conputed refs
const currentLocation = computed(() => {
  switch (locationSearchMode.value) {
    case 'address': {
      return addressCoordinates.value
    }
    case 'zipcode': {
      return zipcodePolygon.value.centroid
    }
    case 'keyword':
    default: {
      return userLocation.value
    }
  }
})

const sortLocationsOptions = computed(() => {
  return hasLocationData(currentLocation.value)
    ? sortLocationsOptionsAll
    : sortLocationsOptionsAlpha
})

const currentLocations = computed(() => {
  if (isLoading.value || errorMessage.value) {
    return []
  }
  const filteredLocations = filterLocations(oemLocations, locationFilterMode)
  const searchedLocations = keywordsForSearch.value
    ? searchLocations(filteredLocations, keywordsForSearch)
    : filteredLocations
  return sortLocations(searchedLocations, currentLocation, locationSortMode)
})

// watchers
watch(currentLocation, () => {
  // watch for changes in currentLocation to handle changes to sort mode
  const newLocHasLoc = hasLocationData(currentLocation.value)
  switch (true) {
    case newLocHasLoc && !locationSortMode.value: {
      // if new location matches type of LatLon and no sort mode has been selected, set sort mode to distance-ascending
      locationSortMode.value = 'DistAsc'
      break
    }
    case !newLocHasLoc && Object.keys(sortLocationsOptionsDist).includes(locationSortMode.value): {
      // if new location does not match type LatLon and a distance sort is selected, set sort mode to default sort
      locationSortMode.value = ''
      break
    }
  }
})

// event handlers
function handleLocationFilterChange(selectedFilter: string) {
  locationFilterMode.value = selectedFilter as Filters
}

function handleLocationSortChange(sortLocationsOption: string) {
  locationSortMode.value = sortLocationsOption as SortMode
}

function handleSearchSubmit(locationSearchString: string) {
  switch (true) {
    case StreetAddress.test(locationSearchString):
    case StreetIntersection.test(locationSearchString): {
      locationSearchMode.value = 'address'
      addressForSearch.value = locationSearchString
      break
    }
    case Zipcode.test(locationSearchString): {
      locationSearchMode.value = 'zipcode'
      zipcodeForSearch.value = locationSearchString
      break
    }
    case locationSearchString !== '': {
      locationSearchMode.value = 'keyword'
      keywordsForSearch.value = locationSearchString
      break
    }
    default: {
      locationSearchMode.value = false
      addressForSearch.value = locationSearchString
      zipcodeForSearch.value = locationSearchString
      keywordsForSearch.value = locationSearchString
    }
  }
}

function handleGeolocate(locationData: LatLon & { accuracy: number }) {
  console.log('Geolocation Accuracy: ', locationData.accuracy)
  userLocation.value = {
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
</script>

<template>
  <Pinboard
    :locations="currentLocations"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :location-panel-search="searchPlaceholderText"
    :location-panel-filter="filterOptions"
    :location-panel-sort="sortLocationsOptions"
    @search="handleSearchSubmit"
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
          v-for="loc in [...currentLocations].sort((a, b) => b.latitude - a.latitude)"
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
