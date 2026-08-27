<!-- ABOUTME: The 311 reports finder — Pinboard map + list of nearby reports with
     service-type filter chips, geolocation-seeded load, and inline report detail. -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  Pinboard,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle,
  PinboardComposables,
} from '@pinboard/ui'
import type { PinboardTypes, MapCardProps } from '@pinboard/ui'
import { useReportFinder } from '@/composables/useReportFinder'
import ReportDetail from '@/components/ReportDetail.vue'
import { searchAddress } from '@/composables/useAis'
import ReportCallout from '@/components/ReportCallout.vue'
import FilterChips from '@/components/FilterChips.vue'
import ReportListingCard from '@/components/ReportListingCard.vue'
import MapConstraints from '@/components/MapConstraints.vue'
import ClusteredMarkers from '@/components/ClusteredMarkers.vue'
import LocationAccuracyCircle from '@/components/LocationAccuracyCircle.vue'

const finder = useReportFinder()
const isMobile = PinboardComposables.useIsMobile()
const searchPlaceholder = 'Search by address or ZIP'

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

function onLocated(data: { longitude: number; latitude: number; accuracy: number }) {
  locatedFix.value = data
}

onMounted(() => {
  void finder.init()
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
  <Pinboard
    :locations="finder.locations.value"
    :search-or-user-location="finder.searchOrUserLocation.value"
    :is-loading="finder.isLoading.value ? 'Loading reports…' : false"
    :error-message="finder.errorMessage.value"
    :get-map-card-props="getMapCardProps"
    :is-mobile="isMobile"
    :location-panel-search="searchPlaceholder"
    location-panel-count-noun="report"
    :location-search-mode="locationSearchMode"
    @search="onSearch"
  >
    <template #locations-header>
      <ReportCallout />
    </template>

    <template #locations-filters>
      <FilterChips
        :options="finder.filterOptions.value"
        :model-value="finder.filter.value"
        @update:model-value="finder.setFilter"
      />
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
  </Pinboard>
</template>

<style>
.location-card--custom:not(.location-card--selected) {
  border: none;
  border-radius: 0;
  background: transparent;
}
.location-card--custom.location-card--hovered:not(.location-card--selected) {
  outline: none;
}

.location-list {
  gap: 0;
}
</style>
