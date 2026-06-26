<script setup lang="ts">
import { computed, ref, toRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PinboardBody,
  CircleLayer,
  MapNavigationControl,
  MapIconTextPin,
  MapMarker,
  GeolocationButton,
  BasemapToggle,
  PinboardComposables,
  PinboardUtilities,
  Callout,
} from '@pinboard/ui'
import type { FilterValues, PinboardTypes } from '@pinboard/ui'
import { useLocations } from '@/composables/useLocations'
import { useFilterChipDefinitions } from '@/composables/filters/useFilterChipDefinitions.ts'
import { useFilterLogic } from '@/composables/filters/useFilterLogic'
import LocationCard from '@/components/LocationCard.vue'
import LocationDetail from '@/components/LocationDetail.vue'
import type { PrimaryCareFilterValues, PrimaryCareLocation, PrimaryCareResponse } from '@/types'
import { IconLocationDot } from '@phila/phila-ui-core/icons'

import {
  sortLocations
} from '@/utilities/sortLocations'

const emptyFilters: PrimaryCareFilterValues = {
  sort: '',
  ageGroup: [],
  waitTime: [],
  visitType: [],
  specialty: [],
  tests: [],
  languages: [],
}

const { t } = useI18n()
const isMobile = PinboardComposables.useIsMobile()
const { filterChipDefinitions } = useFilterChipDefinitions()
const { locations, isLoading, errorMessage, geojson } = useLocations()

// Location is requested only when the user clicks the geolocation button, which
// emits to handleGeolocate. The shared useUserLocation composable prompts on load,
// which the primary care finder intentionally avoids.
const userLocation = ref<PinboardTypes.LatLon>({
  latitude: NaN,
  longitude: NaN,
})
const addressForSearch = ref<string>('')
const { addressCoordinates, finishedAddressFetch } =
  PinboardComposables.useSearchAddress(addressForSearch)
const zipcodeForSearch = ref<string>('')
const { zipcodePolygon, finishedZipFetch } = PinboardComposables.useSearchZipcode(zipcodeForSearch)
const keywordsForSearch = ref<string>('')
const locationSearchMode = ref<PinboardTypes.SearchMode>(undefined)
const { searchOrUserLocation } = PinboardComposables.useUserAndSearchLocations(
  userLocation,
  addressCoordinates,
  finishedAddressFetch,
  zipcodePolygon,
  finishedZipFetch
)
const filterState = ref<PrimaryCareFilterValues>(emptyFilters)
const { filterLogicalValue } = useFilterLogic(locations, filterState)

const locationsWithDistance = computed<PrimaryCareLocation[]>(() => {
  const { latitude, longitude } = userLocation.value
  return locations.value.map((loc) => ({
    ...loc,
    locationCardInfo: {
      ...loc.locationCardInfo,
      subheader: PinboardUtilities.hasLocationData(userLocation.value)
        ? `${PinboardUtilities.getHaversineDistance(
            { latitude: loc.latitude, longitude: loc.longitude },
            { latitude, longitude },
            1
          )} mi`
        : undefined,
    },
  }))
})

const filteredGeojson = computed<PrimaryCareResponse | undefined>(() => {
  if (geojson.value?.features) {
    let result = filterLogicalValue.value.length
      ? applyFilters(geojson.value.features)
      : geojson.value.features

    if (keywordsForSearch.value) {
      const terms = keywordsForSearch.value.replace(/\W+/g, ' ').toLowerCase().split(' ').filter(Boolean)
      result = result.filter((loc) => {
        const haystack = JSON.stringify(Object.values(loc)).toLowerCase()
        return terms.some((term) => haystack.includes(term))
      })
    }

    return {
      type: 'FeatureCollection',
      features: result,
    }
  }
  return undefined
})

const filteredLocations = computed<PrimaryCareLocation[]>(() => {
  let result = filterLogicalValue.value.length
    ? applyFilters(locationsWithDistance.value)
    : locationsWithDistance.value

  if (keywordsForSearch.value) {
    const terms = keywordsForSearch.value.replace(/\W+/g, ' ').toLowerCase().split(' ').filter(Boolean)
    result = result.filter((loc) => {
      const haystack = JSON.stringify(Object.values(loc)).toLowerCase()
      return terms.some((term) => haystack.includes(term))
    })
  }

  return filterState.value.sort ? sortLocations(result, searchOrUserLocation, filterState.value.sort) : result
})

function applyFilters<T>(arr: T[]): T[] {
  const filtered: T[] = []
  let check = 1
  let offset = 0
  arr.forEach((item) => {
    if (check & filterLogicalValue.value[offset]) {
      filtered.push(item)
    }
    check <<= 1
    if (check & 0x100000000) {
      check = 1
      offset++
    }
  })
  return filtered
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

function handleGeolocate(locationData: { latitude: number; longitude: number; accuracy: number }) {
  console.log('Geolocation Accuracy: ', locationData.accuracy)
  userLocation.value = {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
  }
}

function handleGeolocateError(error: Error | GeolocationPositionError) {
  console.error(error)
}

function handleApplyFilter(value: FilterValues) {
  filterState.value = Object.keys(filterState.value).length
    ? (value as PrimaryCareFilterValues)
    : emptyFilters
}

function asPrimaryCareLocation(location: PinboardTypes.BasicLocation) {
  return location as PrimaryCareLocation
}
</script>

<template>
  <PinboardBody
    v-model:filter-values="filterState"
    :locations="filteredLocations"
    :search-or-user-location="searchOrUserLocation"
    :location-search-mode="locationSearchMode"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :location-panel-search="t('searchPlaceholder')"
    :geojson="filteredGeojson"
    :is-mobile="isMobile"
    :filters="filterChipDefinitions"
    @search="handleSearchSubmit"
    @update:filter-values="handleApplyFilter"
  >
    <template #locations-header>
      <div v-if="!isMobile" class="locations-callout">
        <Callout type="info" :title="t('callout.title')">
          {{ t('callout.message') }}
          <RouterLink to="/info">{{ t('callout.linkText') }}</RouterLink>
        </Callout>
      </div>
    </template>

    <template #location-card="{ location }">
      <LocationCard :location="asPrimaryCareLocation(location)" />
    </template>

    <template #location-detail="{ location, onClose }">
      <LocationDetail :location="asPrimaryCareLocation(location)" :on-close="onClose" />
    </template>

    <template
      #map-content="{ hoveredId, selectedId, zoom, mobileControlsTarget, onHover, onHoverEnd, onSelect }"
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

      <CircleLayer
        v-if="filteredGeojson"
        id="locations"
        :source="{ type: 'geojson', data: toRaw(filteredGeojson) as any }"
        :paint="{
          'circle-radius': [
            'case',
            ['==', ['get', 'id'], selectedId ?? ''],
            12,
            ['==', ['get', 'id'], hoveredId ?? ''],
            10,
            7,
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'id'], selectedId ?? ''],
            '#0D47A1',
            ['==', ['get', 'id'], hoveredId ?? ''],
            '#1976D2',
            '#1976D2',
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        }"
        @mouseenter="(e: any) => onHover(e.features?.[0]?.properties?.id)"
        @mouseleave="onHoverEnd"
        @click="
          (e: any) => {
            const feature = e.features?.[0]
            if (!feature) return
            const loc = locationsWithDistance.find((l) => l.id === feature.properties?.id)
            if (loc) onSelect(loc)
          }
        "
      />
      <MapMarker
          v-if="PinboardUtilities.hasLocationData(searchOrUserLocation)"
          key="searchOrUserLocation"
          :lng-lat="[searchOrUserLocation.longitude, searchOrUserLocation.latitude]"
        >
          <MapIconTextPin :zoom="zoom" :icon="IconLocationDot" color-theme="light-tertiary" />
        </MapMarker>
    </template>
  </PinboardBody>
</template>

<style scoped>
.locations-callout {
  padding: 1.5rem 1rem 0 1rem;
}

.locations-callout :deep(.callout-title) {
  font-size: var(--scale-200);
  text-align: left;
}
</style>
