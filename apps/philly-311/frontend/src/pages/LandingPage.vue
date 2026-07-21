<!-- ABOUTME: The 311 reports finder — Pinboard map + list of nearby reports with
     service-type filter chips, geolocation-seeded load, and inline report detail. -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { Pinboard, MapNavigationControl, GeolocationButton, BasemapToggle } from '@pinboard/ui'
import { useReportFinder } from '@/composables/useReportFinder'
import ReportDetail from '@/components/ReportDetail.vue'
import { searchAddress } from '@/composables/useAis'
import ReportCallout from '@/components/ReportCallout.vue'
import FilterChips from '@/components/FilterChips.vue'
import ReportListingCard from '@/components/ReportListingCard.vue'
import MapConstraints from '@/components/MapConstraints.vue'
import ClusteredMarkers from '@/components/ClusteredMarkers.vue'

const finder = useReportFinder()
const searchPlaceholder = 'Search by address or ZIP'

onMounted(() => {
  void finder.init()
})

async function onSearch(query: string) {
  const feature = await searchAddress(query)
  if (feature) finder.setCenter({ latitude: feature.lat, longitude: feature.lng })
}
</script>

<template>
  <Pinboard
    :locations="finder.locations.value"
    :search-or-user-location="finder.searchOrUserLocation.value"
    :is-loading="finder.isLoading.value"
    :error-message="finder.errorMessage.value"
    :location-panel-search="searchPlaceholder"
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
        isMobile,
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
        position="top-right"
        :teleport-to="isMobile ? mobileControlsTarget : undefined"
      />
      <GeolocationButton
        :position="isMobile ? 'top-right' : 'bottom-right'"
        :teleport-to="isMobile ? mobileControlsTarget : undefined"
      />
      <ClusteredMarkers
        :locations="finder.locations.value"
        :zoom="zoom"
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
