<script setup lang="ts">
// vue imports
import { computed, ref, watch } from 'vue'

// 3rd party imports
import { faGauge, faCamera } from '@fortawesome/free-solid-svg-icons'
import { faLocationDot } from '@fortawesome/pro-solid-svg-icons'

// philly ui imports
// pinboard imports
import {
  Pinboard,
  MapMarker,
  MapIconTextPin,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle,
  FillLayer,
  MapCheckboxLegend,
  PinboardComposables,
  PinboardUtilities,
  type PinboardTypes,
} from '@pinboard/ui'
import {
  filterLocations,
  isGauge,
  searchLocations,
  sortLocations,
  FLOOD_LAYER_IDS,
  FLOOD_LAYER_CONFIG,
  FLOOD_LEGEND_ITEMS,
  type FloodLayerId,
} from '@/utilities/_index'

// app imports
import LocationDetail from '@/components/LocationDetail.vue'
import { useLocations } from '@/composables/useLocations'
import type { Filters, OemLocation, SortMode } from '@/types'

// app variables
const searchPlaceholderText = 'Search by address or keyword...'
const filterOptions: PinboardTypes.LocationFilterOption[] = [
  { value: 'all' satisfies Filters, label: 'All' },
  { value: 'gauges' satisfies Filters, label: 'Gauge' },
  { value: 'cameras' satisfies Filters, label: 'Camera' },
]
const sortLocationsOptions: PinboardTypes.SortLocationsOptions = {
  DistAsc: 'Distance',
  AlphaAsc: 'Alphabetical',
}

// refs
const addressForSearch = ref<string>('')
const { addressCoordinates, finishedAddressFetch } =
  PinboardComposables.useSearchAddress(addressForSearch)
const zipcodeForSearch = ref<string>('')
const { zipcodePolygon, finishedZipFetch } = PinboardComposables.useSearchZipcode(zipcodeForSearch)
const keywordsForSearch = ref<string>('')
const locationSearchMode = ref<PinboardTypes.SearchMode>(undefined)
const locationFilterMode = ref<Filters>('all')
const visitedIds = ref(new Set<string>())
const visibleFloodLayers = ref<FloodLayerId[]>([])
const { oemLocations, userLocation, isLoading, errorMessage } = useLocations()
const locationSortMode = ref<SortMode>(
  PinboardUtilities.hasLocationData(userLocation) ? 'DistAsc' : '',
)
const { searchOrUserLocation } = PinboardComposables.userUserAndSearchLocations(
  userLocation,
  addressCoordinates,
  finishedAddressFetch,
  zipcodePolygon,
  finishedZipFetch,
)

// conputed refs
const hasCurrentLocation = computed(() =>
  PinboardUtilities.hasLocationData(searchOrUserLocation.value),
)

const currentLocations = computed(() => {
  if (isLoading.value || errorMessage.value) {
    return []
  }
  const filteredLocations = filterLocations(oemLocations, locationFilterMode)
  const searchedLocations = keywordsForSearch.value
    ? searchLocations(filteredLocations, keywordsForSearch)
    : filteredLocations
  const gotSearchMatches = typeof searchedLocations !== 'string'
  if (!gotSearchMatches) console.log(searchedLocations)
  return gotSearchMatches
    ? sortLocations(searchedLocations, searchOrUserLocation, locationSortMode)
    : []
})

// watchers
watch(
  () => searchOrUserLocation.value,
  (newLocation) => {
    // watch for changes in searchOrUserLocation to handle changes to sort mode
    const newLocHasLoc = PinboardUtilities.hasLocationData(newLocation)
    switch (true) {
      case newLocHasLoc && !locationSortMode.value: {
        // if new location matches type of LatLon and no sort mode has been selected, set sort mode to distance-ascending
        locationSortMode.value = 'DistAsc'
        break
      }
      case !newLocHasLoc && locationSortMode.value === 'DistAsc': {
        // if new location does not match type LatLon and a distance sort is selected, set sort mode to default sort
        locationSortMode.value = ''
        break
      }
    }
  },
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
    case PinboardUtilities.StreetAddress.test(locationSearchString):
    case PinboardUtilities.StreetIntersection.test(locationSearchString): {
      locationSearchMode.value = 'address'
      addressForSearch.value = locationSearchString
      zipcodeForSearch.value = ''
      keywordsForSearch.value = ''
      break
    }
    case PinboardUtilities.Zipcode.test(locationSearchString): {
      locationSearchMode.value = 'zipcode'
      zipcodeForSearch.value = locationSearchString
      addressForSearch.value = ''
      keywordsForSearch.value = ''
      break
    }
    case locationSearchString !== '': {
      locationSearchMode.value = 'keyword'
      keywordsForSearch.value = locationSearchString
      addressForSearch.value = ''
      zipcodeForSearch.value = ''
      break
    }
    default: {
      locationSearchMode.value = undefined
      addressForSearch.value = locationSearchString
      zipcodeForSearch.value = locationSearchString
      keywordsForSearch.value = locationSearchString
    }
  }
}

function handleGeolocate(locationData: PinboardTypes.LatLon & { accuracy: number }) {
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
    :search-or-user-location="searchOrUserLocation"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :location-panel-search="searchPlaceholderText"
    :location-panel-filter="filterOptions"
    :location-panel-sort="sortLocationsOptions"
    :location-search-mode="locationSearchMode"
    :location-panel-location-available="hasCurrentLocation"
    @search="handleSearchSubmit"
    @selected-locations-filter="handleLocationFilterChange"
    @sort-locations-option="handleLocationSortChange"
    @deselect="handleDeselect"
  >
    <template #location-detail="{ location, onClose }">
      <LocationDetail :location="location as OemLocation" :on-close="onClose" />
    </template>

    <template
      #map-content="{
        hoveredId,
        selectedId,
        zoom,
        isMobile,
        mobileControlsTarget,
        mobileControlsTargetLeft,
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

      <FillLayer
        v-for="id in FLOOD_LAYER_IDS"
        :key="id"
        :id="`fema-flood-${id}`"
        :source="{ type: 'geojson', data: FLOOD_LAYER_CONFIG[id].url }"
        :paint="{ 'fill-color': FLOOD_LAYER_CONFIG[id].color, 'fill-opacity': 0.28 }"
        :layout="{ visibility: visibleFloodLayers.includes(id) ? 'visible' : 'none' }"
      />
      <MapCheckboxLegend
        v-model="visibleFloodLayers"
        title="Flood Plains"
        :items="FLOOD_LEGEND_ITEMS"
        position="bottom-left"
        :leave-room-for-controls="false"
        :teleport-to="isMobile ? mobileControlsTargetLeft : undefined"
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
            :color-theme="isGauge(loc) ? 'light-primary' : 'light-purple'"
            :hovered="hoveredId === loc.id"
            :selected="selectedId === loc.id"
            :visited="visitedIds.has(loc.id)"
            @mouseenter="onHover(loc.id)"
            @mouseleave="onHoverEnd()"
            @click="handleSelect(loc, onSelect)"
          />
        </MapMarker>
        <MapMarker
          v-if="PinboardUtilities.hasLocationData(searchOrUserLocation)"
          key="searchOrUserLocation"
          :lng-lat="[searchOrUserLocation.longitude, searchOrUserLocation.latitude]"
        >
          <MapIconTextPin :zoom="zoom" :icon="faLocationDot" color-theme="light-tertiary" />
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
