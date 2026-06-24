<script setup lang="ts">
import { computed, ref, toRaw, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PinboardBody,
  CircleLayer,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle,
  PinboardComposables,
  PinboardUtilities,
  FilterChoiceBitfieldGroup,
  FilterGroup,
  Callout
} from '@pinboard/ui'
import type { FilterValues, PinboardTypes } from '@pinboard/ui'
import {
  ageGroupFilterParams,
  waitTimeFilterParams,
  visitTypeFilterParams,
  specialtyFilterParams,
  testsFilterParams,
  languageFilterParams,
  optionNames,
} from '../configs/filterLogicParams.ts'
import { useLocations } from '../composables/useLocations'
import LocationCard from '../components/LocationCard.vue'
import LocationDetail from '../components/LocationDetail.vue'
import type { PrimaryCareFilterValues, PrimaryCareLocation, PrimaryCareResponse } from '../types'

const isMobile = PinboardComposables.useIsMobile()
const { t } = useI18n()

const emptyFilters: PrimaryCareFilterValues = {
  sort: '',
  ageGroup: [],
  waitTime: [],
  visitType: [],
  specialty: [],
  tests: [],
  languages: [],
}

const searchPlaceholderText = computed(() => t('searchPlaceholder'))
import { filterDefinitions } from '../configs/filterChipDefinitions.ts'

const { locations, isLoading, errorMessage, geojson } = useLocations()
// Location is requested only when the user clicks the geolocation button, which
// emits to handleGeolocate. The shared useUserLocation composable prompts on load,
// which the primary care finder intentionally avoids.
const userLocation = ref<PinboardTypes.LatLon>({
  latitude: NaN,
  longitude: NaN,
})
const searchString = ref('')


const filterLogicalValues = ref<Uint32Array>(new Uint32Array())

const filterValues = ref<PrimaryCareFilterValues>(emptyFilters)

const filterLogic = computed(() => {
  const commonParams = {
    data: locations.value,
    bufferLength: Math.ceil(locations.value.length / 32),
  }
  const ageGroupFilter = new FilterChoiceBitfieldGroup({
    ...commonParams,
    ...ageGroupFilterParams,
  })
  const waitTimeFilter = new FilterChoiceBitfieldGroup({
    ...commonParams,
    ...waitTimeFilterParams,
  })

  const visitTypeFilter = new FilterChoiceBitfieldGroup({
    ...commonParams,
    ...visitTypeFilterParams,
  })

  const specialtyFilter = new FilterChoiceBitfieldGroup({
    ...commonParams,
    ...specialtyFilterParams,
  })

  const testsFilter = new FilterChoiceBitfieldGroup({
    ...commonParams,
    ...testsFilterParams,
  })

  const languageFilter = new FilterChoiceBitfieldGroup({
    ...commonParams,
    ...languageFilterParams,
  })

  const filterLogicGroup = new FilterGroup({
    operation: '&',
    bufferLength: commonParams.bufferLength,
    childFilters: {
      [filterDefinitions.value[1].key]: ageGroupFilter,
      [filterDefinitions.value[2].key]: waitTimeFilter,
      [filterDefinitions.value[3].key]: visitTypeFilter,
      [filterDefinitions.value[4].key]: specialtyFilter,
      [filterDefinitions.value[5].key]: testsFilter,
      [filterDefinitions.value[6].key]: languageFilter,
    },
  })
  return filterLogicGroup
})

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

const filteredGeojson = computed<PrimaryCareResponse | undefined>(() => {
  if (geojson.value?.features) {
    let result = filterLogicalValues.value.length ? applyFilters(geojson.value.features) : geojson.value.features

    if (searchString.value) {
      const terms = searchString.value.replace(/\W+/g, ' ').toLowerCase().split(' ').filter(Boolean)
      result = result.filter((loc) => {
        const haystack = JSON.stringify(Object.values(loc)).toLowerCase()
        return terms.some((term) => haystack.includes(term))
      })
    }

    return {
      type: 'FeatureCollection',
      features: result,
    }
  }
  return undefined
})

const filteredLocations = computed<PrimaryCareLocation[]>(() => {
  let result = filterLogicalValues.value.length ? applyFilters(locationsWithDistance.value) : locationsWithDistance.value

  if (searchString.value) {
    const terms = searchString.value.replace(/\W+/g, ' ').toLowerCase().split(' ').filter(Boolean)
    result = result.filter((loc) => {
      const haystack = JSON.stringify(Object.values(loc)).toLowerCase()
      return terms.some((term) => haystack.includes(term))
    })
  }

  return result
})

watchEffect(() => {
  // age group
  filterLogic.value.childFilters[filterDefinitions.value[1].key].childFilters[
    optionNames.adult
  ].setChecked(filterValues.value.ageGroup.includes(optionNames.adult))
  filterLogic.value.childFilters[filterDefinitions.value[1].key].childFilters[
    optionNames.children
  ].setChecked(filterValues.value.ageGroup.includes(optionNames.children))

  // wait time
  filterLogic.value.childFilters[filterDefinitions.value[2].key].childFilters[
    optionNames.sameDay
  ].setChecked(filterValues.value.waitTime.includes(optionNames.sameDay))
  filterLogic.value.childFilters[filterDefinitions.value[2].key].childFilters[
    optionNames.weekWell
  ].setChecked(filterValues.value.waitTime.includes(optionNames.weekWell))
  filterLogic.value.childFilters[filterDefinitions.value[2].key].childFilters[
    optionNames.weekSick
  ].setChecked(filterValues.value.waitTime.includes(optionNames.weekSick))
  filterLogic.value.childFilters[filterDefinitions.value[2].key].childFilters[
    optionNames.twoMonths
  ].setChecked(filterValues.value.waitTime.includes(optionNames.twoMonths))

  // visit type
  filterLogic.value.childFilters[filterDefinitions.value[3].key].childFilters[
    optionNames.primaryWell
  ].setChecked(filterValues.value.visitType.includes(optionNames.primaryWell))
  filterLogic.value.childFilters[filterDefinitions.value[3].key].childFilters[
    optionNames.primarySick
  ].setChecked(filterValues.value.visitType.includes(optionNames.primarySick))
  filterLogic.value.childFilters[filterDefinitions.value[3].key].childFilters[
    optionNames.primarySports
  ].setChecked(filterValues.value.visitType.includes(optionNames.primarySports))
  filterLogic.value.childFilters[filterDefinitions.value[3].key].childFilters[
    optionNames.primaryPrenatal
  ].setChecked(filterValues.value.visitType.includes(optionNames.primaryPrenatal))
  filterLogic.value.childFilters[filterDefinitions.value[3].key].childFilters[
    optionNames.primaryWomen
  ].setChecked(filterValues.value.visitType.includes(optionNames.primaryWomen))
  filterLogic.value.childFilters[filterDefinitions.value[3].key].childFilters[
    optionNames.primaryTelehealth
  ].setChecked(filterValues.value.visitType.includes(optionNames.primaryTelehealth))
  filterLogic.value.childFilters[filterDefinitions.value[3].key].childFilters[
    optionNames.primaryVaccines
  ].setChecked(filterValues.value.visitType.includes(optionNames.primaryVaccines))

  // specialty
  filterLogic.value.childFilters[filterDefinitions.value[4].key].childFilters[
    optionNames.mental
  ].setChecked(filterValues.value.specialty.includes(optionNames.mental))
  filterLogic.value.childFilters[filterDefinitions.value[4].key].childFilters[
    optionNames.dental
  ].setChecked(filterValues.value.specialty.includes(optionNames.dental))
  filterLogic.value.childFilters[filterDefinitions.value[4].key].childFilters[optionNames.eye].setChecked(
    filterValues.value.specialty.includes(optionNames.eye)
  )
  filterLogic.value.childFilters[filterDefinitions.value[4].key].childFilters[
    optionNames.podiatry
  ].setChecked(filterValues.value.specialty.includes(optionNames.podiatry))
  filterLogic.value.childFilters[filterDefinitions.value[4].key].childFilters[optionNames.mat].setChecked(
    filterValues.value.specialty.includes(optionNames.mat)
  )
  filterLogic.value.childFilters[filterDefinitions.value[4].key].childFilters[
    optionNames.nutrition
  ].setChecked(filterValues.value.specialty.includes(optionNames.nutrition))
  filterLogic.value.childFilters[filterDefinitions.value[4].key].childFilters[
    optionNames.tobacco
  ].setChecked(filterValues.value.specialty.includes(optionNames.tobacco))
  filterLogic.value.childFilters[filterDefinitions.value[4].key].childFilters[
    optionNames.pharmacy
  ].setChecked(filterValues.value.specialty.includes(optionNames.pharmacy))

  // tests
  filterLogic.value.childFilters[filterDefinitions.value[5].key].childFilters[
    optionNames.blood
  ].setChecked(filterValues.value.tests.includes(optionNames.blood))
  filterLogic.value.childFilters[filterDefinitions.value[5].key].childFilters[optionNames.sti].setChecked(
    filterValues.value.tests.includes(optionNames.sti)
  )
  filterLogic.value.childFilters[filterDefinitions.value[5].key].childFilters[
    optionNames.covid
  ].setChecked(filterValues.value.tests.includes(optionNames.covid))
  filterLogic.value.childFilters[filterDefinitions.value[5].key].childFilters[
    optionNames.mammo
  ].setChecked(filterValues.value.tests.includes(optionNames.mammo))
  filterLogic.value.childFilters[filterDefinitions.value[5].key].childFilters[
    optionNames.xray
  ].setChecked(filterValues.value.tests.includes(optionNames.xray))

  // languages
  filterLogic.value.childFilters[filterDefinitions.value[6].key].childFilters[
    optionNames.spanish
  ].setChecked(filterValues.value.languages.includes(optionNames.spanish))
  filterLogic.value.childFilters[filterDefinitions.value[6].key].childFilters[
    optionNames.mandarin
  ].setChecked(filterValues.value.languages.includes(optionNames.mandarin))
  filterLogic.value.childFilters[filterDefinitions.value[6].key].childFilters[
    optionNames.vietnamese
  ].setChecked(filterValues.value.languages.includes(optionNames.vietnamese))

  filterLogicalValues.value = filterLogic.value.getBitfield()
})

function applyFilters<T>(arr: T[]): T[] {
  const filtered: T[] = []
  let check = 1
  let offset = 0
  arr.forEach((item) => {
    if (check & filterLogicalValues.value[offset]) {
      filtered.push(item)
    }
    check <<= 1
    if (!(check & 0xffffffff)) {
      check = 1
      offset++
    }
  })
  return filtered
}

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
  console.error(error)
}

function handleApplyFilter(value: FilterValues) {
  filterValues.value = Object.keys(filterValues.value).length
    ? (value as PrimaryCareFilterValues)
    : emptyFilters
}

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
    :geojson="filteredGeojson"
    :is-mobile="isMobile"
    :filters="filterDefinitions"
    @search="handleSearchSubmit"
    @update:filter-values="handleApplyFilter"
  >
    <template #locations-header>
      <div v-if="!isMobile" class="locations-callout">
        <Callout
          type="info"
          title="Free and low-cost medical care in Philadelphia"
          message="Our primary care finder can help you find a provider in Philadelphia. These health care centers serve everyone. Your immigration status or ability to pay won't stop you from getting the care you need."
        />
      </div>
    </template>

    <template #location-card="{ location }">
      <LocationCard :location="asPrimaryCareLocation(location)" />
    </template>

    <template #location-detail="{ location, onClose }">
      <LocationDetail :location="asPrimaryCareLocation(location)" :on-close="onClose" />
    </template>

    <template
      #map-content="{
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
        v-if="filteredGeojson"
        id="locations"
        :source="{ type: 'geojson', data: toRaw(filteredGeojson) as any }"
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

<style scoped>
.locations-callout {
  padding: 1.5rem 1rem 0 1rem;
}

.locations-callout :deep(.callout-title) {
  font-size: var(--scale-200);
  text-align: left;
}
</style>
