<!-- ABOUTME: The 311 reports finder — Pinboard map + list of nearby reports with
     service-type filter chips, geolocation-seeded load, and inline report detail. -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  PinboardBody,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle,
  PinboardComposables,
} from '@pinboard/ui'
import type { PinboardTypes, MapCardProps, FilterDefinition } from '@pinboard/ui'
import { useReportFinder } from '@/composables/useReportFinder'
import ReportDetail from '@/components/ReportDetail.vue'
import { searchAddress } from '@/composables/useAis'
import ReportCallout from '@/components/ReportCallout.vue'
import ReportCta from '@/components/ReportCta.vue'
import ReportListingCard from '@/components/ReportListingCard.vue'
import MapConstraints from '@/components/MapConstraints.vue'
import ClusteredMarkers from '@/components/ClusteredMarkers.vue'
import LocationAccuracyCircle from '@/components/LocationAccuracyCircle.vue'
import { serviceTypeIconComponent } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'

const finder = useReportFinder()
const isMobile = PinboardComposables.useIsMobile()
const searchPlaceholder = 'Search by address or ZIP'

const route = useRoute()
const selectedReportId = computed(() =>
  typeof route.query.location === 'string' ? route.query.location : undefined,
)
const { visibleLocations, setMapBounds } = PinboardComposables.useMapBoundsFilter(
  finder.locations,
  { alwaysInclude: selectedReportId },
)

function getMapCardProps(location: PinboardTypes.BasicLocation): MapCardProps {
  const report = finder.reportById(location.id)
  return {
    heading: location.name,
    body: report?.address ?? '',
  } satisfies MapCardProps
}
// 'address' after a successful geocode — Pinboard pans the map to
// searchOrUserLocation only while an address/zipcode search mode is set.
const locationSearchMode = ref<PinboardTypes.SearchMode>(undefined)

const locatedFix = ref<{ latitude: number; longitude: number; accuracy: number } | null>(null)

const filters = computed<FilterDefinition[]>(() => {
  const a = finder.filterOptions.value.map((o) => ({
    key: o.value,
    label: o.label,
    // FilterChipGroup icons are Vue functional components; the shared cached
    // wrapper keeps chips visually in sync with the map markers.
    icon: serviceTypeIconComponent(o.label),
    iconColor: serviceTypeColor(o.label),
  }))
  console.log('LandingPage-filters: ', a)
  return a
})

const filterValues = ref<Record<string, boolean>>(
  Object.fromEntries(
    finder.filterOptions.value.map((o) => [o.value, o.value === finder.filter.value]),
  ),
)

watch(filterValues, (newValue) => {
  // console.log("newValue: ", newValue)
  const on = Object.keys(filterValues.value).filter((k) => filterValues.value[k] === true)
  const added = on.find((k) => k !== finder.filter.value)
  const value = added ?? (on.length > 0 ? finder.filter.value : 'all')
  if (value !== finder.filter.value) finder.filter.value = value
})

function onLocated(data: { longitude: number; latitude: number; accuracy: number }) {
  locatedFix.value = data
}

onMounted(() => {
  finder.init()
})

async function onSearch(query: string) {
  const feature = await searchAddress(query)
  if (feature) {
    locationSearchMode.value = 'address'
    finder.setCenter({ latitude: feature.lat, longitude: feature.lng })
  }
}
</script>

<template>
  <PinboardBody
    v-model:filter-values="filterValues"
    v-model:is-loading="finder.isLoading.value"
    v-model:search-or-user-location="finder.searchOrUserLocation.value"
    v-model:location-search-mode="locationSearchMode"
    v-model:error-message="finder.errorMessage.value"
    :locations="visibleLocations"
    :get-map-card-props="getMapCardProps"
    :is-mobile="isMobile"
    :location-panel-search="searchPlaceholder"
    location-panel-count-noun="report"
    :filters="filters"
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
      <ReportListingCard
        v-if="finder.reportById(location.id)"
        :report="finder.reportById(location.id)!"
      />
      <p v-else>{{ location.name }}</p>
    </template>

    <template #location-detail="{ location, onClose }">
      <ReportDetail
        v-if="finder.reportById(location.id)"
        :report="finder.reportById(location.id)!"
        :on-close="onClose"
      />
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
        :locations="finder.locations.value"
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
