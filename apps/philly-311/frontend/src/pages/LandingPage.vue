<!-- ABOUTME: The 311 reports finder — Pinboard map + list of nearby reports with
     service-type filter chips, geolocation-seeded load, and inline report detail. -->
<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  PinboardBody,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle,
  PinboardComposables,
  IS_MOBILE_KEY,
} from '@pinboard/ui'
import type { MapCardProps, FilterValue, SearchMode } from '@pinboard/ui'
import { useReportFinder } from '@/composables/useReportFinder'
import ReportDetail from '@/components/ReportDetail.vue'
import { searchAddress } from '@/composables/useAis'
import ReportCallout from '@/components/ReportCallout.vue'
import ReportCta from '@/components/ReportCta.vue'
import ReportListingCard from '@/components/ReportListingCard.vue'
import MapConstraints from '@/components/MapConstraints.vue'
import ClusteredMarkers from '@/components/ClusteredMarkers.vue'
import LocationAccuracyCircle from '@/components/LocationAccuracyCircle.vue'
import type { ReportLocation } from '@/types/app'

const finder = useReportFinder()
const isMobile = inject(IS_MOBILE_KEY, ref(true))
const searchPlaceholder = 'Search by address or ZIP'

const route = useRoute()
const selectedReportId = computed(() =>
  typeof route.query.location === 'string' ? route.query.location : undefined,
)
const { visibleLocations, setMapBounds } = PinboardComposables.useMapBoundsFilter(
  finder.locations,
  { alwaysInclude: selectedReportId },
)

function getMapCardProps(location: ReportLocation): MapCardProps {
  return {
    heading: location.name,
    body: location.address,
  }
}
// 'address' after a successful geocode — Pinboard pans the map to
// searchOrUserLocation only while an address/zipcode search mode is set.
const locationSearchMode = ref<SearchMode>(undefined)

const locatedFix = ref<{ latitude: number; longitude: number; accuracy: number } | null>(null)

const filterValues = ref<FilterValue>({ toggles: {} })

watch(
  () => filterValues.value.toggles,
  (newValues) => {
    const iOfTrue = Object.values(newValues).indexOf(true)
    finder.setFilter(iOfTrue >= 0 ? Object.keys(filterValues.value?.toggles)[iOfTrue] : 'all')
  },
  {
    deep: 1,
  },
)

onMounted(() => {
  finder.init()
})

function onLocated(data: { longitude: number; latitude: number; accuracy: number }) {
  locatedFix.value = data
}

async function onSearch(query: string) {
  const feature = await searchAddress(query)
  if (feature) {
    locationSearchMode.value = 'address'
    finder.setCenter({ latitude: feature.lat, longitude: feature.lng })
  }
}

// function searchLocations<T>(
//   locations: Ref<T[]> | T[],
//   searchKeywords: Ref<string>,
// ) {
//   locations = toValue(locations)
//   const searchTerms = searchKeywords.value.replace(/\W+/, ' ').toLowerCase().split(' ')
//   const matches = locations.filter((loc) => {
//     const locString = JSON.stringify(Object.values(loc)).toLowerCase()
//     return searchTerms.some((term) => locString.match(term))
//   })
//   return matches.length ? matches : 'No results...'
// }
</script>

<template>
  <PinboardBody
    v-model:filter-values="filterValues"
    v-model:location-search-mode="locationSearchMode"
    v-model:search-or-user-location="finder.searchOrUserLocation.value"
    v-model:error-message="finder.errorMessage.value"
    :locations="visibleLocations"
    :filters="finder.filterOptions.value"
    :is-loading="finder.isLoading.value ? 'Loading reports…' : false"
    :get-map-card-props="getMapCardProps"
    :is-mobile="isMobile"
    :location-panel-search="searchPlaceholder"
    location-panel-count-noun="report"
    :initial-bottom-sheet-snap-index="1"
    @search="onSearch"
    @bounds-change="setMapBounds"
  >
    <template #locations-header>
      <ReportCallout />
    </template>

    <template #locations-footer>
      <ReportCta />
    </template>

    <template #location-card="{ location }">
      <ReportListingCard :report="location" />
    </template>

    <template #location-detail="{ location, onClose }">
      <ReportDetail :report="location" :on-close="onClose" />
    </template>

    <template
      #map-content="{
        map,
        zoom,
        hoveredId,
        selectedId,
        mobileControlsTarget,
        onHover,
        onHoverEnd,
        onSelect,
      }"
    >
      <MapConstraints v-if="map" :map="map" />
      <MapNavigationControl v-if="!isMobile" position="bottom-right" />
      <BasemapToggle
        position="bottom-right"
        :teleport-to="isMobile ? mobileControlsTarget : undefined"
      />
      <GeolocationButton
        :position="isMobile ? 'top-right' : 'bottom-right'"
        :teleport-to="isMobile ? mobileControlsTarget : undefined"
        @located="onLocated"
      />
      <LocationAccuracyCircle
        v-if="locatedFix"
        :latitude="locatedFix.latitude"
        :longitude="locatedFix.longitude"
        :accuracy="locatedFix.accuracy"
        :zoom="zoom"
      />
      <!-- Rounded zoom: clustering and pin sizing are integer-granular, and a
           fractional zoom prop would re-render every marker per animation frame. -->
      <ClusteredMarkers
        :locations="visibleLocations"
        :zoom="Math.round(zoom)"
        :map="map"
        :hovered-id="hoveredId"
        :selected-id="selectedId"
        @hover="onHover"
        @hover-end="onHoverEnd"
        @select="onSelect"
      />
    </template>
  </PinboardBody>
</template>

<style>
.location-card--custom:not(.location-card--selected) {
  border: none;
  border-radius: 0;
  background: transparent;
}
.location-card--custom.location-card--hovered:not(.location-card--selected) {
  outline: transparent;
}

.location-list {
  gap: 0;
}
</style>
