<!-- ABOUTME: My Requests — the signed-in user's 311 cases on the Pinboard chassis:
     stat tiles in the page header, case cards + map pins, case detail panel. -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Pinboard, MapNavigationControl, BasemapToggle, PinboardComposables } from '@pinboard/ui'
import { Callout } from '@phila/phila-ui-callout'
import type { PinboardTypes, MapCardProps } from '@pinboard/ui'
import { useAuth } from '@phila/sso-vue'
import { useMyCases } from '@/composables/useMyCases'
import { reportToLocation, statusBucket } from '@/utils/reportCard'
import { DEFAULT_CENTER } from '@/utils/geoDefaults'
import StatTile from '@/components/StatTile.vue'
import ReportListingCard from '@/components/ReportListingCard.vue'
import ReportDetail from '@/components/ReportDetail.vue'
import ClusteredMarkers from '@/components/ClusteredMarkers.vue'
import MapConstraints from '@/components/MapConstraints.vue'

const auth = useAuth()
const cases = useMyCases(auth)
const isMobile = PinboardComposables.useIsMobile()

const locations = computed(() => cases.reports.value.map(reportToLocation))
// Required by Pinboard; without a location-search-mode the map never pans to it.
const searchOrUserLocation: PinboardTypes.LatLon = {
  latitude: DEFAULT_CENTER.lat,
  longitude: DEFAULT_CENTER.lng,
}
const reportById = (id: string) => cases.reports.value.find((r) => r.id === id)

const counts = computed(() => {
  const c = { resolved: 0, inProgress: 0, closed: 0 }
  for (const r of cases.reports.value) c[statusBucket(r.status)]++
  return c
})

function getMapCardProps(location: PinboardTypes.BasicLocation): MapCardProps {
  const report = reportById(location.id)
  return {
    heading: location.name,
    body: report?.address ?? '',
  } satisfies MapCardProps
}

onMounted(() => {
  void cases.load()
})
</script>

<template>
  <Pinboard
    :locations="locations"
    :search-or-user-location="searchOrUserLocation"
    :is-loading="cases.isLoading.value ? 'Loading your requests…' : false"
    :error-message="cases.errorMessage.value"
    :get-map-card-props="getMapCardProps"
    :is-mobile="isMobile"
    location-panel-count-noun="request"
  >
    <template #page-header>
      <div class="reports-page-header">
        <h1>My Requests</h1>
        <ul class="reports-stats">
          <li><StatTile label="Total" :value="cases.reports.value.length" tone="neutral" /></li>
          <li><StatTile label="Resolved" :value="counts.resolved" tone="success" /></li>
          <li><StatTile label="In Progress" :value="counts.inProgress" tone="info" /></li>
          <li><StatTile label="Closed" :value="counts.closed" tone="danger" /></li>
        </ul>
      </div>
    </template>

    <template #locations-header>
      <Callout
        v-if="!cases.isLoading.value && !cases.errorMessage.value && !cases.reports.value.length"
        class="reports-empty"
        type="info"
        message="You haven't submitted any requests yet."
      >
        <RouterLink to="/report">Report an issue</RouterLink>
      </Callout>
    </template>

    <template #location-card="{ location }">
      <ReportListingCard v-if="reportById(location.id)" :report="reportById(location.id)!" />
      <p v-else>{{ location.name }}</p>
    </template>

    <template #location-detail="{ location, onClose }">
      <ReportDetail
        v-if="reportById(location.id)"
        :report="reportById(location.id)!"
        :on-close="onClose"
        :show-case-fields="true"
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
      <!-- Rounded zoom: clustering and pin sizing are integer-granular, and a
           fractional zoom prop would re-render every marker per animation frame. -->
      <ClusteredMarkers
        :locations="locations"
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

<style scoped>
.reports-page-header {
  padding: var(--spacing-m, 1rem) var(--spacing-l, 1.5rem);
}

.reports-page-header h1 {
  margin: 0 0 var(--spacing-m, 1rem);
}

.reports-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-m, 1rem);
  margin: 0;
  padding: 0;
  list-style: none;
}

.reports-stats > li {
  flex: 1 1 10rem;
  margin: 0;
}

/* Bounded 2x2 grid on narrow screens so the header leaves room for map + sheet. */
@media (max-width: 768px) {
  .reports-page-header {
    padding: var(--spacing-s, 0.75rem) var(--spacing-m, 1rem);
  }
  .reports-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-s, 0.75rem);
  }
  .reports-stats :deep(.stat-tile__value) {
    font-size: 1.75rem;
  }
}

.reports-empty {
  margin: var(--spacing-m, 1rem);
}
</style>
