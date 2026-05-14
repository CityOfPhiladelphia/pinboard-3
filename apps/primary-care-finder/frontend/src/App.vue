<script setup lang="ts">
import { computed, ref, toRaw } from 'vue'
import {
  PinboardBody,
  PinboardShell,
  CircleLayer,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle,
  PinboardComposables,
  PinboardUtilities,
} from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { useLocations } from './composables/useLocations'
import LocationCard from './components/LocationCard.vue'
import LocationDetail from './components/LocationDetail.vue'
import type { PrimaryCareLocation } from './types'

const searchPlaceholderText = 'Search by address or keyword...'

const { locations, isLoading, errorMessage, geojson } = useLocations()
const { userLocation } = PinboardComposables.useUserLocation()
const searchString = ref('')

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

const filteredLocations = computed<PrimaryCareLocation[]>(() => {
  if (!searchString.value) return locationsWithDistance.value
  const terms = searchString.value
    .replace(/\W+/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
  return locationsWithDistance.value.filter((loc) => {
    const haystack = JSON.stringify(Object.values(loc)).toLowerCase()
    return terms.some((term) => haystack.includes(term))
  })
})

function handleSearchSubmit(s: string) {
  searchString.value = s
}

function handleGeolocate(locationData: {
  latitude: number
  longitude: number
  accuracy: number
}) {
  console.log('Geolocation Accuracy: ', locationData.accuracy)
  userLocation.value = {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
  }
}

function handleGeolocateError(error: Error | GeolocationPositionError) {
  console.log(error)
}

function getCardDetails(loc: { name: string; [key: string]: unknown }) {
  return { heading: loc.name, isLoading: false }
}
</script>

<template>
  <PinboardShell
    title="Primary Care Finder"
    :logo="{
      variant: 'city',
      layout: 'single-line',
      colorScheme: 'on-primary',
      customName: 'Primary Care Finder',
      href: '/',
    }"
    info-title="About this tool"
  >
    <template #mobile-nav>
      <h4><a href="/">Finder</a></h4>
      <h4><a href="/about">About</a></h4>
    </template>

    <template #info-body>
      <span class="has-text-body-small">
        This tool helps Philadelphia residents find free and low-cost primary
        care providers near them. Search by location, filter by services, and
        view details like hours, transit options, and available tests.
      </span>
    </template>

    <PinboardBody
      :locations="filteredLocations"
      :search-or-user-location="userLocation"
      :get-card-details="getCardDetails"
      :is-loading="isLoading"
      :error-message="errorMessage"
      :location-panel-search="searchPlaceholderText"
      :geojson="geojson"
      @search="handleSearchSubmit"
    >
      <template #location-card="{ location }">
        <LocationCard :location="location" />
      </template>

      <template #location-detail="{ location, onClose }">
        <LocationDetail
          :location="location as PrimaryCareLocation"
          :on-close="onClose"
        />
      </template>

      <template
        #map-content="{
          geojson,
          hoveredId,
          selectedId,
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
          @located="handleGeolocate"
          @error="handleGeolocateError"
        />

        <CircleLayer
          v-if="geojson"
          id="locations"
          :source="{ type: 'geojson', data: toRaw(geojson) as any }"
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
              const loc = locationsWithDistance.find(
                (l) => l.id === feature.properties?.id
              )
              if (loc) onSelect(loc)
            }
          "
        />
      </template>
    </PinboardBody>
  </PinboardShell>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
