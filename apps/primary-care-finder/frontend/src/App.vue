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
import { faArrowUpArrowDown } from '@fortawesome/pro-solid-svg-icons'
import type { FilterDefinition, FilterValues, PinboardTypes } from '@pinboard/ui'
import { useLocations } from './composables/useLocations'
import LocationCard from './components/LocationCard.vue'
import LocationDetail from './components/LocationDetail.vue'
import type { PrimaryCareLocation } from './types'

const searchPlaceholderText = 'Search by address or keyword...'

const { locations, isLoading, errorMessage, geojson } = useLocations()
// Location is requested only when the user clicks the geolocation button, which
// emits to handleGeolocate. The shared useUserLocation composable prompts on load,
// which the primary care finder intentionally avoids.
const userLocation = ref<PinboardTypes.LatLon>({
  latitude: NaN,
  longitude: NaN,
})
const searchString = ref('')

const filterValues = ref<FilterValues>({})

const filterDefinitions: FilterDefinition[] = [
  {
    key: 'sort',
    label: 'Sort',
    multiple: false,
    excludeFromCount: true,
    iconDefinition: faArrowUpArrowDown,
    // TODO(teammate): finalize sort options + ordering logic.
    choices: [
      { text: 'Distance', value: 'distance' },
      { text: 'Name (A–Z)', value: 'name' },
    ],
  },
  {
    key: 'ageGroup',
    label: 'Age Group',
    multiple: true,
    choices: [
      { text: 'Adult', value: 'adult' },
      { text: 'Children', value: 'children' },
    ],
  },
  {
    key: 'waitTime',
    label: 'Wait time (Primary Care)',
    multiple: true,
    choices: [
      { text: 'Same day or walk in', value: 'sameDay' },
      { text: '<1 week (well visit)', value: 'weekWell' },
      { text: '<1 week (sick visit)', value: 'weekSick' },
      { text: '<2 months (all primary care)', value: 'twoMonths' },
    ],
  },
  {
    key: 'specialty',
    label: 'Speciality services',
    multiple: true,
    choices: [
      { text: 'Mental health', value: 'mental' },
      { text: 'Dental', value: 'dental' },
      { text: 'Eye care', value: 'eye' },
      { text: 'Podiatry', value: 'podiatry' },
      { text: 'MAT', value: 'mat' },
      { text: 'Nutrition', value: 'nutrition' },
      { text: 'Tobacco cessation', value: 'tobacco' },
      { text: 'Pharmacy', value: 'pharmacy' },
    ],
  },
  {
    key: 'tests',
    label: 'Tests and imaging',
    multiple: true,
    choices: [
      { text: 'Blood', value: 'blood' },
      { text: 'STI', value: 'sti' },
      { text: 'COVID', value: 'covid' },
      { text: 'Mammography', value: 'mammo' },
      { text: 'X-ray', value: 'xray' },
    ],
  },
  {
    key: 'languages',
    label: 'Languages spoken by staff',
    multiple: true,
    // TODO(teammate): replace with real `language` field values.
    choices: [
      { text: 'Spanish', value: 'spanish' },
      { text: 'Mandarin', value: 'mandarin' },
      { text: 'Vietnamese', value: 'vietnamese' },
    ],
  },
]

// SEAM: data wiring belongs to the teammate. Returns locations unfiltered for now.
// TODO(teammate): map filterValues → PrimaryCareProperties predicates.
//   ageGroup   → cross-cutting: match *_ad / *_ch fields per selection
//   waitTime   → wait_* fields
//   specialty  → special_* fields
//   tests      → tests_* fields
//   languages  → language field
//   sort       → ordering (apply after filtering; not a predicate)
function applyFilters(
  locations: PrimaryCareLocation[],
  _values: FilterValues
): PrimaryCareLocation[] {
  return locations
}

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
  let result = applyFilters(locationsWithDistance.value, filterValues.value)

  if (searchString.value) {
    const terms = searchString.value.replace(/\W+/g, ' ').toLowerCase().split(' ').filter(Boolean)
    result = result.filter((loc) => {
      const haystack = JSON.stringify(Object.values(loc)).toLowerCase()
      return terms.some((term) => haystack.includes(term))
    })
  }

  return result
})

function handleSearchSubmit(s: string) {
  searchString.value = s
}

function handleGeolocate(locationData: { latitude: number; longitude: number; accuracy: number }) {
  console.log('Geolocation Accuracy: ', locationData.accuracy)
  userLocation.value = {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
  }
}

function handleGeolocateError(error: Error | GeolocationPositionError) {
  console.log(error)
}

const isMobile = PinboardComposables.useIsMobile()

function asPrimaryCareLocation(location: PinboardTypes.BasicLocation) {
  return location as PrimaryCareLocation
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
    <template #info-body>
      <span class="has-text-body-small">
        This tool helps Philadelphia residents find free and low-cost primary care providers near
        them. Search by location, filter by services, and view details like hours, transit options,
        and available tests.
      </span>
    </template>

    <PinboardBody
      v-model:filter-values="filterValues"
      :locations="filteredLocations"
      :search-or-user-location="userLocation"
      :is-loading="isLoading"
      :error-message="errorMessage"
      :location-panel-search="searchPlaceholderText"
      :geojson="geojson"
      :is-mobile="isMobile"
      :filters="filterDefinitions"
      @search="handleSearchSubmit"
    >
      <template #location-card="{ location }">
        <LocationCard :location="location" />
      </template>

      <template #location-detail="{ location, onClose }">
        <LocationDetail :location="asPrimaryCareLocation(location)" :on-close="onClose" />
      </template>

      <template
        #map-content="{
          geojson,
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
          position="bottom-right"
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
              const loc = locationsWithDistance.find((l) => l.id === feature.properties?.id)
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

.phila-navbar-brand {
  padding-left: var(--spacing-l);
}
</style>
