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
import { sortLocationsOptions } from '@/types'
import type { LocationFilterOption } from '@ui/types'
import LocationDetail from '@/components/LocationDetail.vue'
import { computed, ref } from 'vue'

const { oemLocations, isLoading, errorMessage } = useLocations()
const locationSearchString = ref<string>('')
const locationFilterMode = ref<Filters>('all')
const locationSortMode = ref<string>('')
const visitedIds = ref(new Set<string>())
const searchPlaceholderText = 'Search by address or keyword...'

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
      const sorted = locs.sort((a, b) => a.name.localeCompare(b.name))
      return sorted
    }
    case 'AlphaDes': {
      const sorted = locs.sort((a, b) => b.name.localeCompare(a.name))
      return sorted
    }
    case 'DistAsc': {
      // NEED TO IMPLEMENT ONCE THE CARD INFO IF FIXED
      return locs
    }
    case 'DistDes': {
      // NEED TO IMPLEMENT ONCE THE CARD INFO IF FIXED
      return locs
    }
    default: {
      return locs
    }
  }
})

function isGauge(loc: OemLocation): boolean {
  return loc.deviceType === 'Aware' || loc.deviceType === 'Usgs'
}

const filterOptions: LocationFilterOption[] = [
  { value: 'all' satisfies Filters, label: 'All' },
  { value: 'gauges' satisfies Filters, label: 'Gauge' },
  { value: 'cameras' satisfies Filters, label: 'Camera' },
]

function handleLocationFilterChange(selectedFilter: string) {
  locationFilterMode.value = selectedFilter as Filters
}

function handleLocationSortChange(sortLocationsOption: string) {
  locationSortMode.value = sortLocationsOption
}

function handleLocationSearchSubmit(locationsSearchString: string) {
  locationSearchString.value = locationsSearchString
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
