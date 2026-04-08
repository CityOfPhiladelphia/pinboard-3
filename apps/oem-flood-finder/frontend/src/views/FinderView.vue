<script setup lang="ts" , generic="T">
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
import { ref, computed, watch } from 'vue'

const { locations, isLoading, errorMessage } = useLocations()
const locationSearchString = ref<string>('')
const locationFilterMode = ref<Filters>('all')
const locationSortMode = ref<number>(SortLocationsValues.None)
const searchPlaceholderText = 'Search by address or keyword...'

const filteredLocations = computed(() => {
  if (isLoading.value || errorMessage.value) {
    return []
  }
  const locs = [...locations.value] as OemLocation[]
  switch (locationFilterMode.value) {
    case 'all': {
      return locs
    }
    case 'gauges': {
      return locs.filter((loc) => isGauge(loc))
    }
    case 'cameras': {
      return locs.filter((loc) => loc.other.kind === 'Camera')
    }
  }
})

const sortedLocations = computed(() => {
  if (isLoading.value || errorMessage.value) {
    return []
  }
  const locs = [...filteredLocations.value] as OemLocation[]
  switch (locationSortMode.value) {
    case SortLocationsValues.AlphaAsc: {
      quickSortObjectArrayByStringField(locs, 'name')
      return locs
    }
    case SortLocationsValues.AlphaDes: {
      quickSortObjectArrayByStringField(locs, 'name', '-')
      return locs
    }
    case SortLocationsValues.DistAsc: {
      // NEED TO IMPLEMENT ONCE THE CARD INFO IF FIXED
      return locs
    }
    case SortLocationsValues.DistDes: {
      // NEED TO IMPLEMENT ONCE THE CARD INFO IF FIXED
      return locs
    }
    case SortLocationsValues.None:
    default: {
      return locs
    }
  }
})

// function sortedLocations() {
//   switch (locationFilterMode.value) {
//     case 'all': {
//       sortLocations(locs)
//       console.log('IN FILTER: ', JSON.parse(JSON.stringify(locs)))
//       return locs
//     }
//     case 'gauges': {

//       sortLocations(filtered)
//       console.log('IN FILTER: ', JSON.parse(JSON.stringify(filtered)))
//       return filtered
//     }
//     case 'cameras': {
//       const filtered = locs.filter((loc) => loc.other.kind === 'Camera')
//       sortLocations(filtered)
//       console.log('IN FILTER: ', JSON.parse(JSON.stringify(filtered)))
//       return filtered
//     }
//   }
// }

watch(locationSortMode, () => {
  sortLocations(filteredLocations.value)
})

function quickSortObjectArrayByStringField(
  array: Array<any>,
  field: string,
  direction: '+' | '-' = '+',
) {
  quickSort(array, direction)
  function quickSort(
    array: Array<any>,
    direction: '+' | '-',
    low: number = 0,
    high: number = array.length - 1,
  ): void {
    if (low >= 0 && high >= 0 && low < high) {
      const pivot_i = partition(array, direction, low, high)
      quickSort(array, direction, low, pivot_i - 1)
      quickSort(array, direction, pivot_i + 1, high)
    }
  }

  function partition(array: Array<any>, direction: '+' | '-', low: number, high: number): number {
    const pivot = array[low]
    while (true) {
      if (direction === '+') {
        while (array[low][field].localeCompare(pivot[field]) < 0) {
          low++
        }
        while (array[high][field].localeCompare(pivot[field]) > 0) {
          high--
        }
      } else if (direction === '-') {
        while (array[low][field].localeCompare(pivot[field]) > 0) {
          low++
        }
        while (array[high][field].localeCompare(pivot[field]) < 0) {
          high--
        }
      }

      if (low >= high) {
        return high
      }
      const temp = array[low]
      array[low] = array[high]
      array[high] = temp
    }
  }
}

function sortLocations(locs: OemLocation[]) {
  switch (locationSortMode.value) {
    case SortLocationsValues.AlphaAsc: {
      quickSortObjectArrayByStringField(locs, 'name')
    }
    case SortLocationsValues.AlphaDes: {
      quickSortObjectArrayByStringField(locs, 'name', '-')
    }
    case SortLocationsValues.DistAsc: {
      // NEED TO IMPLEMENT ONCE THE CARD INFO IF FIXED
      return locs
    }
    case SortLocationsValues.DistDes: {
      // NEED TO IMPLEMENT ONCE THE CARD INFO IF FIXED
      return locs
    }
    case SortLocationsValues.None:
    default: {
      return locs
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
    :locations="sortedLocations ?? new Array()"
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
          v-for="loc in sortedLocations"
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
