<script setup lang="ts">
import { computed, ref, toRaw } from 'vue'
import {
  PinboardBody,
  CircleLayer,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle,
  PinboardComposables,
  PinboardUtilities,
} from '@pinboard/ui'
import { faArrowUpArrowDown } from '@fortawesome/pro-solid-svg-icons'
import type { FilterDefinition, FilterValues, PinboardTypes } from '@pinboard/ui'
import { useI18n } from 'vue-i18n'
import { useLocations } from '../composables/useLocations'
import LocationCard from '../components/LocationCard.vue'
import LocationDetail from '../components/LocationDetail.vue'
import type { PrimaryCareLocation } from '../types'

const { t } = useI18n()

const searchPlaceholderText = computed(() => t('searchPlaceholder'))

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

const filterDefinitions = computed<FilterDefinition[]>(() => [
  {
    key: 'sort',
    label: t('filters.sort'),
    multiple: false,
    excludeFromCount: true,
    iconDefinition: faArrowUpArrowDown,
    // TODO(teammate): finalize sort options + ordering logic.
    choices: [
      { text: t('filters.distance'), value: 'distance' },
      { text: t('filters.name'), value: 'name' },
    ],
  },
  {
    key: 'ageGroup',
    label: t('filters.ageGroup'),
    multiple: true,
    choices: [
      { text: t('filters.adult'), value: 'adult' },
      { text: t('filters.children'), value: 'children' },
    ],
  },
  {
    key: 'waitTime',
    label: t('filters.waitTime'),
    multiple: true,
    choices: [
      { text: t('filters.sameDay'), value: 'sameDay' },
      { text: t('filters.weekWell'), value: 'weekWell' },
      { text: t('filters.weekSick'), value: 'weekSick' },
      { text: t('filters.twoMonths'), value: 'twoMonths' },
    ],
  },
  {
    key: 'specialty',
    label: t('filters.specialty'),
    multiple: true,
    choices: [
      { text: t('filters.mental'), value: 'mental' },
      { text: t('filters.dental'), value: 'dental' },
      { text: t('filters.eye'), value: 'eye' },
      { text: t('filters.podiatry'), value: 'podiatry' },
      { text: t('filters.mat'), value: 'mat' },
      { text: t('filters.nutrition'), value: 'nutrition' },
      { text: t('filters.tobacco'), value: 'tobacco' },
      { text: t('filters.pharmacy'), value: 'pharmacy' },
    ],
  },
  {
    key: 'tests',
    label: t('filters.tests'),
    multiple: true,
    choices: [
      { text: t('filters.blood'), value: 'blood' },
      { text: t('filters.sti'), value: 'sti' },
      { text: t('filters.covid'), value: 'covid' },
      { text: t('filters.mammo'), value: 'mammo' },
      { text: t('filters.xray'), value: 'xray' },
    ],
  },
  {
    key: 'languages',
    label: t('filters.languages'),
    multiple: true,
    // TODO(teammate): replace with real `language` field values.
    choices: [
      { text: t('filters.spanish'), value: 'spanish' },
      { text: t('filters.mandarin'), value: 'mandarin' },
      { text: t('filters.vietnamese'), value: 'vietnamese' },
    ],
  },
])

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
            const loc = locationsWithDistance.find((l) => l.id === feature.properties?.id)
            if (loc) onSelect(loc)
          }
        "
      />
    </template>
  </PinboardBody>
</template>
