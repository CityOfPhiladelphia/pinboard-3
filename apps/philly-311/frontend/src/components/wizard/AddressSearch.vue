<!-- ABOUTME: AIS-backed address search on phila-ui Search/SearchSuggestions. Typing fires
     /autocomplete (debounced); picking a suggestion fires /search and emits select(feature). -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { PinboardSearch } from '@pinboard/ui'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
import { getCurrentPosition } from '@/composables/useGeolocation'
import {
  autocompleteAddresses,
  reverseGeocode,
  searchAddress,
  type AisAutocompleteResult,
} from '@/composables/useAis'
import type { AddressSource } from '@/pages/report/LocationStep.vue'
import LocationImageCard from './LocationImageCard.vue'
import NoAddressDropdown from '@/components/wizard/NoAddressDropdown.vue'

const addressSource = defineModel<AddressSource | undefined>('addressSource', {
  default: undefined,
})
const currentSearch = defineModel<Exclude<AddressSource, 'image'> | null>('currentSearch', {
  default: null,
})
const locationError = defineModel<string>('locationError', {
  default: '',
})

const RESOLVE_ERROR = "Couldn't resolve that address."

const store = useReportSubmissionStore()
const { query, results, error } = useDebouncedSearch<AisAutocompleteResult[]>({
  initial: [],
  fetcher: (q, signal) => autocompleteAddresses(q, signal),
})

const open = ref(false)
const locatingUser = ref(false)
const searchReturnedNull = ref(false)

watch(locatingUser, (locating) => {
  if (locating) useMyLocation()
})

watch(query, () => {
  if (searchReturnedNull.value) searchReturnedNull.value = false
})

watch(addressSource, (newSource) => {
  if (!newSource) query.value = ''
})

async function handleSearch() {
  open.value = false
  currentSearch.value = 'search'
  error.value = undefined
  try {
    const feature = await searchAddress(query.value)
    if (feature && currentSearch.value === 'search') {
      store.setLocation(feature)
      searchReturnedNull.value = false
    } else {
      error.value = RESOLVE_ERROR
      searchReturnedNull.value = true
    }
  } catch {
    error.value = RESOLVE_ERROR
    searchReturnedNull.value = true
  } finally {
    currentSearch.value = null
    addressSource.value = 'search'
    results.value = []
  }
}

async function useMyLocation() {
  open.value = true
  currentSearch.value = 'geoLocation'
  locationError.value = ''
  try {
    const pos = await getCurrentPosition()
    if (!pos) {
      locationError.value = "We couldn't access your location. Type an address instead."
      return
    }
    const feature = await reverseGeocode(pos.lat, pos.lng)
    if (feature && currentSearch.value === 'geoLocation') {
      addressSource.value = 'geoLocation'
      store.setLocation(feature)
    } else locationError.value = "We couldn't resolve your location to an address."
  } catch {
    locationError.value = "We couldn't resolve your location to an address."
  } finally {
    currentSearch.value = null
    locatingUser.value = false
  }
}

function setLocToImage() {
  store.setLocation(store.photo.location)
  addressSource.value = 'image'
  open.value = false
}

function resetLocation() {
  store.setLocation(undefined)
  addressSource.value = undefined
  searchReturnedNull.value = false
}
</script>

<template>
  <PinboardSearch
    v-model:search-string="query"
    v-model:dropdown-open="open"
    v-model:locating-user="locatingUser"
    :search-placeholder="
      store.location?.streetAddress || 'Enter an address, intersection, or zipcode'
    "
    :elevated="true"
    :show-geolocate="true"
    @search="handleSearch"
  >
    <template #suggestion-card>
      <div v-if="store.photo.location?.streetAddress" class="image_location">
        <button class="image_location__button" @click="setLocToImage">
          <LocationImageCard
            :popup-text="'Possible address based on photo'"
            :address="store.photo.location"
            :img-src="store.photo.previewUrl ?? store.photo.mediaUrl"
            show-city-zip
          />
        </button>
      </div>
    </template>
    <template v-if="searchReturnedNull" #no-results>
      <NoAddressDropdown class="location-step__no-address" @reset="resetLocation" />
    </template>
  </PinboardSearch>
</template>

<style scoped>
.image_location {
  padding: 0 var(--spacing-l, 1.5rem) var(--spacing-s, 1.5rem) var(--spacing-l, 1.5rem);
}

.image_location__button {
  cursor: pointer;
  display: grid;
  background-color: transparent;
  border-radius: var(--border-radius-l, 1rem);
  border: 1px solid var(--Schemes-Border-low, #ccc);
  background: var(--Schemes-Background, #fff);
}

.image_location__button:focus-within {
  outline-color: var(--Schemes-Primary, #2b55db);
}
</style>
