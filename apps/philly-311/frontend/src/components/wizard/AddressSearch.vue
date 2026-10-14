<!-- ABOUTME: AIS-backed address search on phila-ui Search/SearchSuggestions. Typing fires
     /autocomplete (debounced); picking a suggestion fires /search and emits select(feature). -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
import {
  autocompleteAddresses,
  reverseGeocode,
  searchAddress,
  type AisAutocompleteResult,
} from '@/composables/useAis'
import type { AddressSource } from '@/pages/report/LocationStep.vue'
import { getCurrentPosition } from '@/composables/useGeolocation'
import type { AisFeature } from '@/types/wizard'
import LocationImageCard from './LocationImageCard.vue'
import { LocationSearch } from '@pinboard/ui'

const addressSource = defineModel<AddressSource | undefined>('addressSource', {
  default: undefined,
})
const currentSearch = defineModel<Exclude<AddressSource, 'image'> | null>('currentSearch', {
  default: null,
})
const locationError = defineModel<string>('locationError', {
  default: '',
})

const emit = defineEmits<{
  select: [feature: AisFeature | null]
}>()

const RESOLVE_ERROR = "Couldn't resolve that address."

const store = useReportSubmissionStore()
const { query, results, error } = useDebouncedSearch<AisAutocompleteResult[]>({
  initial: [],
  fetcher: (q, signal) => autocompleteAddresses(q, signal),
})

// const imageInfo = store.photo.mediaUrl ? '' : null

// Closed after a pick: echoing the resolved address into `query` re-fires the
// debounced autocomplete, and the list must not reopen until the user types.
const open = ref(false)
const locatingUser = ref<boolean>(false)

async function handleSearch() {
  open.value = false
  currentSearch.value = 'search'
  error.value = undefined
  try {
    const feature = await searchAddress(query.value)
    if (feature && currentSearch.value === 'search') {
      emit('select', feature)
    } else {
      error.value = RESOLVE_ERROR
      emit('select', null)
    }
  } catch {
    error.value = RESOLVE_ERROR
    emit('select', null)
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
      emit('select', feature)
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

watch(locatingUser, (locating) => {
  if (locating) useMyLocation()
})
</script>

<template>
  <LocationSearch
    v-model:search-string="query"
    v-model:dropdown-open="open"
    v-model:locating-user="locatingUser"
    :search-placeholder="
      store.location?.streetAddress ?? 'Enter an address, intersection, or zipcode'
    "
    :is-mobile="true"
    :show-geolocate="true"
    class="location-search"
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
  </LocationSearch>
</template>

<style scoped>
.address-search {
  display: grid;
  background-color: var(--colors-White);
  box-shadow: var(--elevation-light-2);
  border-radius: 2.4rem 2.4rem 2.4rem 2.4rem;
  width: 100%;
}

.image_location {
  place-content: center;
  padding: 0 var(--spacing-l, 1.5rem) var(--spacing-l, 1.5rem) var(--spacing-l, 1.5rem);
  width: 100%;
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
