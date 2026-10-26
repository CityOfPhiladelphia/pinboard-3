<!-- ABOUTME: The 311 reports finder — Pinboard map + list of nearby reports with
     service-type filter chips, geolocation-seeded load, and inline report detail. -->
<script setup lang="ts">
import { computed, inject, onBeforeMount, ref, watchEffect } from 'vue'
import {
  PinboardBody,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle,
  MapIconTextPin,
  MapMarker,
  IS_MOBILE_KEY,
  hasLocationData,
} from '@pinboard/ui'
import type { MapCardProps, FilterValue } from '@pinboard/ui'
import { useReportFinder } from '@/composables/useReportFinder'
import ReportDetail from '@/components/ReportDetail.vue'
import ReportCallout from '@/components/ReportCallout.vue'
import ReportCta from '@/components/ReportCta.vue'
import ReportListingCard from '@/components/ReportListingCard.vue'
import MapConstraints from '@/components/MapConstraints.vue'
import ClusteredMarkers from '@/components/ClusteredMarkers.vue'
import LocationAccuracyCircle from '@/components/LocationAccuracyCircle.vue'
import type { ReportLocation } from '@/types/app'
import { IconLocationDot } from '@phila/phila-ui-core/icons'

const finder = useReportFinder()
const isMobile = inject(IS_MOBILE_KEY, ref(true))
const searchPlaceholder = 'Search by address or ZIP'

const filterValues = ref<FilterValue>({ toggles: {} })

const canShowAccuracy = computed(() => {
  return (
    Object.keys(finder.searchOrUserLocation.value).includes('accuracy') &&
    (!finder.locationSearchMode.value || finder.locationSearchMode.value === 'keyword') &&
    hasLocationData(finder.searchOrUserLocation)
  )
})

watchEffect(() => {
  const iOfTrue = Object.values(filterValues.value.toggles).indexOf(true)
  finder.setFilter(iOfTrue >= 0 ? Object.keys(filterValues.value?.toggles)[iOfTrue] : 'all')
})

onBeforeMount(async () => {
  await finder.init()
})

function getMapCardProps(location: ReportLocation): MapCardProps {
  return {
    heading: location.name,
    body: location.address,
  }
}
</script>

<template>
  <PinboardBody
    v-model:filter-values="filterValues"
    v-model:location-search-mode="finder.locationSearchMode.value"
    v-model:search-or-user-location="finder.searchOrUserLocation.value"
    v-model:error-message="finder.errorMessage.value"
    :locations="finder.locations.value"
    :filters="finder.filterOptions.value"
    :is-loading="finder.isLoading.value ? 'Loading reports…' : false"
    :get-map-card-props="getMapCardProps"
    :is-mobile="isMobile"
    :location-panel-search="searchPlaceholder"
    location-panel-count-noun="report"
    :initial-bottom-sheet-snap-index="1"
    :ais-client-id="finder.aisClientId"
    :user-location-state="finder.userLocationState.value"
    :wait-for-user-location="true"
    @search="finder.handleSearchSubmit"
    @bounds-change="finder.setMapBounds"
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
        :show-location-marker="false"
        @located="finder.handleMapGeolocate"
        @error="finder.handleMapGeolocateError"
      />
      <LocationAccuracyCircle
        v-if="canShowAccuracy"
        :latitude="finder.searchOrUserLocation.value.latitude"
        :longitude="finder.searchOrUserLocation.value.longitude"
        :accuracy="finder.searchOrUserLocation.value.accuracy!"
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

      <MapMarker
        v-if="hasLocationData(finder.searchOrUserLocation)"
        key="searchOrUserLocation"
        :lng-lat="[
          finder.searchOrUserLocation.value.longitude,
          finder.searchOrUserLocation.value.latitude,
        ]"
      >
        <MapIconTextPin :zoom="zoom" :icon="IconLocationDot" color-theme="light-tertiary" />
      </MapMarker>
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
