<!-- ABOUTME: The 311 reports finder — Pinboard map + list of nearby reports with
     service-type filter chips, geolocation-seeded load, and inline report detail. -->
<script setup lang="ts">
import { onMounted } from 'vue'
import {
  Pinboard,
  MapMarker,
  MapIconTextPin,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle,
  type PinboardTypes,
} from '@pinboard/ui'
import commonCategories from '@/data/common_categories.json'
import { useReportFinder } from '@/composables/useReportFinder'
import { serviceTypeIconDefinition } from '@/utils/reportIcon'
import ReportDetail from '@/components/ReportDetail.vue'
import { searchAddress } from '@/composables/useAis'
import { useTrendingArticles } from '@/composables/useTrendingArticles'
import ReportCallout from '@/components/ReportCallout.vue'
import TrendingArticles from '@/components/TrendingArticles.vue'

const finder = useReportFinder()
const trending = useTrendingArticles()
const searchPlaceholder = 'Search by address or ZIP'

onMounted(() => {
  void finder.init()
  void trending.init()
})

const filterOptions: PinboardTypes.LocationFilterOption[] = [
  { value: 'all', label: 'All' },
  ...commonCategories.map((c) => ({ value: c.title, label: c.title })),
]

async function onSearch(query: string) {
  const feature = await searchAddress(query)
  if (feature) void finder.setCenter({ latitude: feature.lat, longitude: feature.lng })
}
</script>

<template>
  <Pinboard
    :locations="finder.locations.value"
    :search-or-user-location="finder.searchOrUserLocation.value"
    :is-loading="finder.isLoading.value"
    :error-message="finder.errorMessage.value"
    :location-panel-filter="filterOptions"
    :location-panel-search="searchPlaceholder"
    @selected-locations-filter="finder.setFilter"
    @search="onSearch"
  >
    <template #locations-header>
      <ReportCallout />
      <TrendingArticles :articles="trending.articles.value" />
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
      <MapNavigationControl v-if="!isMobile" position="bottom-right" />
      <BasemapToggle
        position="top-right"
        :teleport-to="isMobile ? mobileControlsTarget : undefined"
      />
      <GeolocationButton
        :position="isMobile ? 'top-right' : 'bottom-right'"
        :teleport-to="isMobile ? mobileControlsTarget : undefined"
      />
      <MapMarker
        v-for="loc in finder.locations.value"
        :key="loc.id"
        :lng-lat="[loc.longitude, loc.latitude]"
      >
        <MapIconTextPin
          :zoom="zoom"
          :icon="serviceTypeIconDefinition(loc.name)"
          color-theme="light-primary"
          :hovered="hoveredId === loc.id"
          :selected="selectedId === loc.id"
          @mouseenter="onHover(loc.id)"
          @mouseleave="onHoverEnd()"
          @click="onSelect(loc)"
        />
      </MapMarker>
    </template>
  </Pinboard>
</template>
