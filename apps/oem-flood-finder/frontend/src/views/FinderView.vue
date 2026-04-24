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
import { useAddressSearch } from '@ui/composables/useAddressSearch'
import { useHaversineDistance } from '@ui/composables/useHaversineDistance'
import { useUserLocation } from '@ui/composables/useUserLocation'
import {
  type LatLon,
  type LocationFilterOption,
  type SortLocationsOptions,
  StreetAddress,
  Zipcode,
} from '@ui/types'

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
const zipcodeForSearch = ref<string>('')
const keywordsForSearch = ref<string>('')
const locationFilterMode = ref<Filters>('all')
const locationSortMode = ref<SortMode>('')
const visitedIds = ref(new Set<string>())
const { oemLocations, isLoading, errorMessage } = useLocations()
const { userLocation } = useUserLocation()
const { addressCoordinates } = useAddressSearch(addressForSearch)

// conputed refs
const currentLocation = computed(() => {
  return hasLocation(addressCoordinates.value) ? addressCoordinates.value : userLocation.value
})

const sortLocationsOptions = computed(() => {
  return hasLocation(currentLocation.value) ? sortLocationsOptionsAll : sortLocationsOptionsAlpha
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
  if (keywordsForSearch.value) {
    const searchTerms = keywordsForSearch.value.replace(/\W+/, ' ').toLowerCase().split(' ')
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
  locs.forEach((location) => {
    location.locationCardInfo.subheader = hasLocation(currentLocation.value)
      ? `${useHaversineDistance(
          { latitude: location.latitude, longitude: location.longitude },
          {
            latitude: currentLocation.value.latitude,
            longitude: currentLocation.value.longitude,
          },
          1,
        )} mi`
      : undefined
  })

  switch (
    hasLocation(currentLocation.value) && !locationSortMode.value
      ? 'DistAsc'
      : locationSortMode.value
  ) {
    case 'AlphaAsc': {
      locs.sort((a, b) => a.name.localeCompare(b.name))
      break
    }
    case 'AlphaDes': {
      locs.sort((a, b) => b.name.localeCompare(a.name))
      break
    }
    case 'DistAsc': {
      locs.sort(
        (a, b) =>
          Number(a.locationCardInfo.subheader?.replace(' mi', '')) -
          Number(b.locationCardInfo.subheader?.replace(' mi', '')),
      )
      break
    }
    case 'DistDes': {
      locs.sort(
        (a, b) =>
          Number(b.locationCardInfo.subheader?.replace(' mi', '')) -
          Number(a.locationCardInfo.subheader?.replace(' mi', '')),
      )
      break
    }
    default: {
      // south to north
      locs.sort((a, b) => a.latitude - b.latitude)
    }
  }
  return locs
})

// watchers
watch(
  currentLocation,
  () => {
    const newLocHasLoc = hasLocation(currentLocation.value)
    switch (true) {
      case newLocHasLoc && !locationSortMode.value: {
        locationSortMode.value = 'DistAsc'
        break
      }
      case !newLocHasLoc &&
        Object.keys(sortLocationsOptionsDist).includes(locationSortMode.value): {
        locationSortMode.value = ''
        break
      }
    }
  },
  // { immediate: true },
)

// event handlers
function handleLocationFilterChange(selectedFilter: string) {
  locationFilterMode.value = selectedFilter as Filters
}

function handleLocationSortChange(sortLocationsOption: string) {
  locationSortMode.value = sortLocationsOption as SortMode
}

function handleSearchSubmit(locationSearchString: string) {
  switch (true) {
    case StreetAddress.test(locationSearchString): {
      console.log('StreetAddress: ', locationSearchString)
      addressForSearch.value = locationSearchString
      break
    }
    case Zipcode.test(locationSearchString): {
      // TODO: implement zipcode search. acts as keyword search for now
      console.log('Zipcode: ', locationSearchString)
      // zipcodeForSearch.value = locationSearchString
      keywordsForSearch.value = locationSearchString
      break
    }
    case locationSearchString !== '': {
      console.log('Keyword: ', locationSearchString)
      keywordsForSearch.value = locationSearchString
      break
    }
    default: {
      console.log('Clear: ', locationSearchString)
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

// utility functions
function isGauge(loc: OemLocation): boolean {
  return loc.deviceType === 'Aware' || loc.deviceType === 'Usgs'
}

function hasLocation(loc: LatLon) {
  return !(Number.isNaN(loc.latitude) || Number.isNaN(loc.longitude))
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
