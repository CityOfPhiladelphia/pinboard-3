<script setup lang="ts">
import { computed, ref, toRaw, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PinboardBody,
  CircleLayer,
  MapNavigationControl,
  MapIconTextPin,
  MapMarker,
  GeolocationButton,
  BasemapToggle,
  PinboardComposables,
  PinboardUtilities,
  Callout,
  shiftLeft,
} from '@pinboard/ui'
import type { FilterValues, PinboardTypes } from '@pinboard/ui'
import { useLocations } from '@/composables/useLocations'
import { useFilterChipDefinitions } from '@/composables/filters/useFilterChipDefinitions.ts'
import { useFilterLogic } from '@/composables/filters/useFilterLogic'
import LocationCard from '@/components/LocationCard.vue'
import LocationDetail from '@/components/LocationDetail.vue'
import { IconLocationDot } from '@phila/phila-ui-core/icons'
import type {
  PrimaryCareFilterLogic,
  PrimaryCareFilters,
  PrimaryCareLocation,
  PrimaryCareResponse,
  SortMode,
} from '@/types'

import { sortLocations } from '@/utilities/sortLocations'

const emptyFilters: PrimaryCareFilters = {
  sort: {
    distance: false,
    name: false,
  },
  ageGroup: {
    adult: false,
    children: false,
  },
  visitType: {
    blood: false,
    covid: false,
    dental: false,
    eye: false,
    mammo: false,
    mat: false,
    mental: false,
    nutrition: false,
    pharmacy: false,
    podiatry: false,
    primaryPrenatal: false,
    primarySick: false,
    primarySports: false,
    primaryTelehealth: false,
    primaryVaccines: false,
    primaryWell: false,
    primaryWomen: false,
    sti: false,
    tobacco: false,
    xray: false,
  },
  waitTime: {
    sameDay: false,
    twoMonths: false,
    weekSick: false,
    weekWell: false,
  },
  languages: {
    amharic: false,
    arabic: false,
    asl: false,
    bengali: false,
    burmese: false,
    cambodian: false,
    cantonese: false,
    chinese: false,
    english: false,
    fanta: false,
    filipino: false,
    french: false,
    frenchcreole: false,
    fula: false,
    gujarati: false,
    haitiancreole: false,
    hebrew: false,
    hindi: false,
    indonesian: false,
    karen: false,
    khmer: false,
    kinyarwanda: false,
    kirundi: false,
    koloqua: false,
    korean: false,
    lebanese: false,
    malayalam: false,
    malaysian: false,
    mandarin: false,
    nepali: false,
    portuguese: false,
    punjabi: false,
    shanghainese: false,
    sinhalese: false,
    spanish: false,
    swahili: false,
    tagalog: false,
    taiwanese: false,
    telugu: false,
    urdu: false,
    vietnamese: false,
    yoruba: false,
  },
}

const { t } = useI18n()
const isMobile = PinboardComposables.useIsMobile()
const { filterChipDefinitions } = useFilterChipDefinitions()
const { locations, isLoading, errorMessage, geojson } = useLocations()
const calloutOpen = ref(true)
// Location is requested only when the user clicks the geolocation button, which
// emits to handleGeolocate. The shared useUserLocation composable prompts on load,
// which the primary care finder intentionally avoids.
const userLocation = ref<PinboardTypes.LatLon>({
  latitude: NaN,
  longitude: NaN,
})
const addressForSearch = ref<string>('')
const { addressCoordinates, finishedAddressFetch } =
  PinboardComposables.useSearchAddress(addressForSearch)
const zipcodeForSearch = ref<string>('')
const { zipcodePolygon, finishedZipFetch } = PinboardComposables.useSearchZipcode(zipcodeForSearch)
const keywordsForSearch = ref<string>('')
const locationSearchMode = ref<PinboardTypes.SearchMode>(undefined)
const { searchOrUserLocation } = PinboardComposables.useUserAndSearchLocations(
  userLocation,
  addressCoordinates,
  finishedAddressFetch,
  zipcodePolygon,
  finishedZipFetch
)
const filterState = ref<PrimaryCareFilters>(emptyFilters)

const { filterLogicalValue, filterLogic } = useFilterLogic(locations, filterState)

const keywordToFilterMap = computed(() => {
  const logicalValues = filterLogic.value as unknown as PrimaryCareFilterLogic
  const keywordMap: Record<string, Uint32Array> = {
    adult: logicalValues.childFilters.ageGroup.childFilters.adult.getBitfield(),
    children: logicalValues.childFilters.ageGroup.childFilters.children.getBitfield(),
    blood: logicalValues.childFilters.tests.childFilters.blood.getBitfield(),
    covid: logicalValues.childFilters.tests.childFilters.covid.getBitfield(),
    sti: logicalValues.childFilters.tests.childFilters.sti.getBitfield(),
    mammo: logicalValues.childFilters.tests.childFilters.mammo.getBitfield(),
    xray: logicalValues.childFilters.tests.childFilters.xray.getBitfield(),
    dental: logicalValues.childFilters.specialty.childFilters.dental.getBitfield(),
    eye: logicalValues.childFilters.specialty.childFilters.eye.getBitfield(),
    mat: logicalValues.childFilters.specialty.childFilters.mat.getBitfield(),
    mental: logicalValues.childFilters.specialty.childFilters.mental.getBitfield(),
    nutrition: logicalValues.childFilters.specialty.childFilters.nutrition.getBitfield(),
    pharmacy: logicalValues.childFilters.specialty.childFilters.pharmacy.getBitfield(),
    podiatry: logicalValues.childFilters.specialty.childFilters.podiatry.getBitfield(),
    tobacco: logicalValues.childFilters.specialty.childFilters.tobacco.getBitfield(),
    primaryPrenatal:
      logicalValues.childFilters.visitType.childFilters.primaryPrenatal.getBitfield(),
    primarySick: logicalValues.childFilters.visitType.childFilters.primarySick.getBitfield(),
    primarySports: logicalValues.childFilters.visitType.childFilters.primarySports.getBitfield(),
    primaryTelehealth:
      logicalValues.childFilters.visitType.childFilters.primaryTelehealth.getBitfield(),
    primaryVaccines:
      logicalValues.childFilters.visitType.childFilters.primaryVaccines.getBitfield(),
    primaryWell: logicalValues.childFilters.visitType.childFilters.primaryWell.getBitfield(),
    primaryWomen: logicalValues.childFilters.visitType.childFilters.primaryWomen.getBitfield(),
    sameDay: logicalValues.childFilters.waitTime.childFilters.sameDay.getBitfield(),
    twoMonths: logicalValues.childFilters.waitTime.childFilters.twoMonths.getBitfield(),
    weekSick: logicalValues.childFilters.waitTime.childFilters.weekSick.getBitfield(),
    weekWell: logicalValues.childFilters.waitTime.childFilters.weekWell.getBitfield(),
    amharic: logicalValues.childFilters.languages.childFilters.amharic.getBitfield(),
    arabic: logicalValues.childFilters.languages.childFilters.arabic.getBitfield(),
    asl: logicalValues.childFilters.languages.childFilters.asl.getBitfield(),
    bengali: logicalValues.childFilters.languages.childFilters.bengali.getBitfield(),
    burmese: logicalValues.childFilters.languages.childFilters.burmese.getBitfield(),
    cambodian: logicalValues.childFilters.languages.childFilters.cambodian.getBitfield(),
    cantonese: logicalValues.childFilters.languages.childFilters.cantonese.getBitfield(),
    chinese: logicalValues.childFilters.languages.childFilters.chinese.getBitfield(),
    english: logicalValues.childFilters.languages.childFilters.english.getBitfield(),
    fanta: logicalValues.childFilters.languages.childFilters.fanta.getBitfield(),
    filipino: logicalValues.childFilters.languages.childFilters.filipino.getBitfield(),
    french: logicalValues.childFilters.languages.childFilters.french.getBitfield(),
    frenchcreole: logicalValues.childFilters.languages.childFilters.frenchcreole.getBitfield(),
    fula: logicalValues.childFilters.languages.childFilters.fula.getBitfield(),
    gujarati: logicalValues.childFilters.languages.childFilters.gujarati.getBitfield(),
    haitiancreole: logicalValues.childFilters.languages.childFilters.haitiancreole.getBitfield(),
    hebrew: logicalValues.childFilters.languages.childFilters.hebrew.getBitfield(),
    hindi: logicalValues.childFilters.languages.childFilters.hindi.getBitfield(),
    indonesian: logicalValues.childFilters.languages.childFilters.indonesian.getBitfield(),
    karen: logicalValues.childFilters.languages.childFilters.karen.getBitfield(),
    khmer: logicalValues.childFilters.languages.childFilters.khmer.getBitfield(),
    kinyarwanda: logicalValues.childFilters.languages.childFilters.kinyarwanda.getBitfield(),
    kirundi: logicalValues.childFilters.languages.childFilters.kirundi.getBitfield(),
    koloqua: logicalValues.childFilters.languages.childFilters.koloqua.getBitfield(),
    korean: logicalValues.childFilters.languages.childFilters.korean.getBitfield(),
    lebanese: logicalValues.childFilters.languages.childFilters.lebanese.getBitfield(),
    malayalam: logicalValues.childFilters.languages.childFilters.malayalam.getBitfield(),
    malaysian: logicalValues.childFilters.languages.childFilters.malaysian.getBitfield(),
    mandarin: logicalValues.childFilters.languages.childFilters.mandarin.getBitfield(),
    nepali: logicalValues.childFilters.languages.childFilters.nepali.getBitfield(),
    portuguese: logicalValues.childFilters.languages.childFilters.portuguese.getBitfield(),
    punjabi: logicalValues.childFilters.languages.childFilters.punjabi.getBitfield(),
    shanghainese: logicalValues.childFilters.languages.childFilters.shanghainese.getBitfield(),
    sinhalese: logicalValues.childFilters.languages.childFilters.sinhalese.getBitfield(),
    spanish: logicalValues.childFilters.languages.childFilters.spanish.getBitfield(),
    swahili: logicalValues.childFilters.languages.childFilters.swahili.getBitfield(),
    tagalog: logicalValues.childFilters.languages.childFilters.tagalog.getBitfield(),
    taiwanese: logicalValues.childFilters.languages.childFilters.taiwanese.getBitfield(),
    telugu: logicalValues.childFilters.languages.childFilters.telugu.getBitfield(),
    urdu: logicalValues.childFilters.languages.childFilters.urdu.getBitfield(),
    vietnamese: logicalValues.childFilters.languages.childFilters.vietnamese.getBitfield(),
    yoruba: logicalValues.childFilters.languages.childFilters.yoruba.getBitfield(),
  }
  return keywordMap
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

const sortMode: ComputedRef<SortMode> = computed(() => {
  return filterState.value.sort.name ? 'name' : filterState.value.sort.distance ? 'distance' : ''
})

const filteredGeojson = computed<PrimaryCareResponse | undefined>(() => {
  if (geojson.value?.features) {
    let result = filterLogicalValue.value.length
      ? applyFilters(geojson.value.features, filterLogicalValue.value)
      : geojson.value.features

    if (keywordsForSearch.value) {
      const terms = keywordsForSearch.value
        .replace(/\W+/g, ' ')
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
      result = result.filter((loc) => {
        const haystack = JSON.stringify(Object.values(loc.properties)).toLowerCase()
        return terms.some((term) => {
          const keywordBits =
            keywordToFilterMap.value?.[term] &&
            keywordToFilterMap.value[term][Math.floor((loc.properties.cartodb_id - 1) / 32)] &
              (1 << Math.floor((loc.properties.cartodb_id - 1) % 32))
          return haystack.includes(term) || keywordBits
        })
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
  let result = filterLogicalValue.value.length
    ? applyFilters(locationsWithDistance.value, filterLogicalValue.value)
    : locationsWithDistance.value

  if (keywordsForSearch.value) {
    const terms = keywordsForSearch.value
      .replace(/\W+/g, ' ')
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
    result = result.filter((loc) => {
      console.log(Object.values(loc.properties))
      const haystack = JSON.stringify(Object.values(loc.properties)).toLowerCase()
      return terms.some((term) => {
        const keywordBits =
          keywordToFilterMap.value?.[term] &&
          keywordToFilterMap.value[term][Math.floor((Number(loc.id) - 1) / 32)] &
            (1 << Math.floor((Number(loc.id) - 1) % 32))
        return haystack.includes(term) || keywordBits
      })
    })
  }

  return filterState.value.sort ? sortLocations(result, searchOrUserLocation, sortMode) : result
})

function applyFilters<T>(arr: T[], bits: Uint32Array): T[] {
  const shiftDirection = shiftLeft()
  const filtered: T[] = []
  let checkBit = 1
  let offset = 0
  arr.forEach((item) => {
    if (checkBit & bits[offset]) {
      filtered.push(item)
    }

    if (checkBit & 0x8000_0000) {
      checkBit = 1
      offset++
    } else {
      checkBit = shiftDirection ? checkBit << 1 : checkBit >> 1
    }
  })
  return filtered
}

function handleSearchSubmit(locationSearchString: string) {
  switch (true) {
    case PinboardUtilities.StreetAddress.test(locationSearchString):
    case PinboardUtilities.StreetIntersection.test(locationSearchString): {
      locationSearchMode.value = 'address'
      addressForSearch.value = locationSearchString
      zipcodeForSearch.value = ''
      keywordsForSearch.value = ''
      break
    }
    case PinboardUtilities.Zipcode.test(locationSearchString): {
      locationSearchMode.value = 'zipcode'
      zipcodeForSearch.value = locationSearchString
      addressForSearch.value = ''
      keywordsForSearch.value = ''
      break
    }
    case locationSearchString !== '': {
      locationSearchMode.value = 'keyword'
      keywordsForSearch.value = locationSearchString
      addressForSearch.value = ''
      zipcodeForSearch.value = ''
      break
    }
    default: {
      locationSearchMode.value = undefined
      addressForSearch.value = locationSearchString
      zipcodeForSearch.value = locationSearchString
      keywordsForSearch.value = locationSearchString
    }
  }
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

function handleApplyFilter(values: FilterValues) {
  filterState.value = values as PrimaryCareFilters
}

function asPrimaryCareLocation(location: PinboardTypes.BasicLocation) {
  return location as PrimaryCareLocation
}
</script>

<template>
  <PinboardBody
    :locations="filteredLocations"
    :search-or-user-location="searchOrUserLocation"
    :location-search-mode="locationSearchMode"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :location-panel-search="t('searchPlaceholder')"
    :geojson="filteredGeojson"
    :is-mobile="isMobile"
    :filters="filterChipDefinitions"
    :filter-values="filterState"
    @search="handleSearchSubmit"
    @update:filter-values="handleApplyFilter"
  >
    <template #locations-header>
      <div v-if="!isMobile" class="locations-callout">
        <Callout v-model:open="calloutOpen" type="info" :title="t('callout.title')">
          {{ t('callout.message') }}
          <RouterLink to="/info">{{ t('callout.linkText') }}</RouterLink>
        </Callout>
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
        zoom,
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
      <MapMarker
        v-if="PinboardUtilities.hasLocationData(searchOrUserLocation)"
        key="searchOrUserLocation"
        :lng-lat="[searchOrUserLocation.longitude, searchOrUserLocation.latitude]"
      >
        <MapIconTextPin :zoom="zoom" :icon="IconLocationDot" color-theme="light-tertiary" />
      </MapMarker>
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
