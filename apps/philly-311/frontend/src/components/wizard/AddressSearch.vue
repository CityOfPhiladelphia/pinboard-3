<!-- ABOUTME: AIS-backed address search on phila-ui Search/SearchSuggestions. Typing fires
     /autocomplete (debounced); picking a suggestion fires /search and emits select(feature). -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { Search } from '@phila/phila-ui-search'
import { SearchSuggestions } from '../../../../../../packages/ui/src/components/_index'
import { PhilaButton } from '@phila/phila-ui-button'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
import {
  autocompleteAddresses,
  reverseGeocode,
  searchAddress,
  type AisAutocompleteResult,
} from '@/composables/useAis'
import { IconLocationCrosshairs, IconLocationDot } from '@phila/phila-ui-core/icons'
import type { AddressSource } from '@/pages/report/LocationStep.vue'
import { getCurrentPosition } from '@/composables/useGeolocation'
import type { AisFeature } from '@/types/wizard'
import LocationImageCard from './LocationImageCard.vue'

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

const searchRef = ref<InstanceType<typeof Search> | null>(null)
const suggestionsRef = ref<InstanceType<typeof SearchSuggestions> | null>(null)

const isOpen = computed(() => open.value && results.value.length > 0)

const suggestions = computed(() => results.value.map((r) => r.address))

function onQueryChange(value: string) {
  query.value = value
  open.value = true
}

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  if (e.key === 'ArrowDown' && isOpen.value && target.tagName === 'INPUT') {
    e.preventDefault()
    suggestionsRef.value?.focusFirst()
  } else if (e.key === 'Escape') {
    open.value = false
  }
}

function onFocusOut(e: FocusEvent) {
  const related = e.relatedTarget as HTMLElement | null
  if (!(e.currentTarget as HTMLElement).contains(related)) open.value = false
}

function onDismiss() {
  open.value = false
  searchRef.value?.focus()
}

async function onSelect(suggestion: string) {
  if (!suggestion) return
  query.value = suggestion
  await handleSearch()
}

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
  }
}

function handleFocus() {
  open.value = true
}

function setLocToImage() {
  store.setLocation(store.photo.location)
  addressSource.value = 'image'
}
</script>

<template>
  <div class="address-search" @keydown="onKeydown" @focusin="handleFocus" @focusout="onFocusOut">
    <Search
      ref="searchRef"
      shape="pill"
      :model-value="query"
      :placeholder="store.location?.streetAddress ?? 'Enter an address, intersection, or zipcode'"
      :leading-icon="IconLocationDot"
      @update:model-value="onQueryChange"
      @search="handleSearch"
    />
    <span class="geolocate_button" :style="{ display: open ? 'flex' : 'none' }">
      <PhilaButton
        text="Use my current location"
        size="extra-small"
        :icon="IconLocationCrosshairs"
        :loading="currentSearch === 'geoLocation'"
        @click="useMyLocation"
      />
    </span>
    <div
      v-if="
        store.photo.location && !(store.location?.lat && store.location.lng) && !suggestions.length
      "
      class="image_location"
      :style="{ display: open ? 'grid' : 'none' }"
    >
      <button class="image_location__button" @click="setLocToImage">
        <LocationImageCard
          :popup-text="'Possible address based on photo'"
          :address="store.photo.location"
          :img-src="store.photo.previewUrl ?? store.photo.mediaUrl"
          show-city-zip
        />
      </button>
    </div>

    <SearchSuggestions
      v-else
      ref="suggestionsRef"
      :suggestions="suggestions"
      :icon="IconLocationDot"
      :style="{ border: 'none' }"
      @select="onSelect"
      @dismiss="onDismiss"
    />
  </div>
</template>

<style scoped>
.address-search {
  display: grid;
  background-color: var(--colors-White);
  box-shadow: var(--elevation-light-2);
  border-radius: 2.4rem 2.4rem 2.4rem 2.4rem;
  width: 100%;
}

.geolocate_button {
  width: 100%;
  padding: var(--spacing-m, 1rem) var(--spacing-m, 1rem) var(--spacing-m, 1rem) 1rem;

  & > button > :is(.phila-button__stack) > :is(.phila-button__content) > :is(.phila-icon-core) {
    font-size: var(--Icon-Solid-Small-font-icon-solid-small-size, 1.125rem);
  }
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
