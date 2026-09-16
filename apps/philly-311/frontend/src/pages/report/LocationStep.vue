<!-- ABOUTME: Wizard step 3 — location. AIS address search is primary; a persistent
     map shows the chosen point with a draggable pin; "Use my current location" uses
     browser geolocation. Stores a complete AisFeature; Next gated on in-Philly. -->
<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { reverseGeocode } from '@/composables/useAis'
import { useWizardValidity, useWizardErrors } from '@/composables/useWizardValidity'
import { isInPhilly } from '@/utils/bounds'
import { Callout } from '@phila/phila-ui-callout'
import { PhilaButton } from '@phila/phila-ui-button'
import { Tags } from '@phila/phila-ui-tags'
import { IconRotateLeft, IconArrowsUpDownLeftRight } from '@phila/phila-ui-core/icons'
import AddressSearch from '@/components/wizard/AddressSearch.vue'
import LocationMap from '@/components/wizard/LocationMap.vue'
import ReportStep from '@/components/wizard/ReportStep.vue'
import type { AisFeature } from '@/types/wizard'
import NoAddressDropdown from '@/components/wizard/NoAddressDropdown.vue'

export type AddressSource = 'image' | 'search' | 'geoLocation' | 'mapPin'

const stepTitle = 'Confirm Location'
const defaultError = 'Choose an address to continue'

const store = useReportSubmissionStore()
const errorMessage = ref('')
const locationError = ref('')
const currentSearch = ref<Exclude<AddressSource, 'image'> | null>(null)
const addressSource = ref<AddressSource | undefined>('image')
const searchReturnedNull = ref(false)

const searchIsdNull = computed(() => {
  return addressSource.value === 'search' && searchReturnedNull.value
  // return true
})

const isValidLocation = computed(
  () => !!store.location && isInPhilly(store.location.lat, store.location.lng),
)
useWizardValidity(isValidLocation)
const wizardError = useWizardErrors()

watch([locationError, wizardError], ([newLocationError, newWizardError]) => {
  errorMessage.value = (newWizardError ? defaultError : newLocationError) ?? ''
})

const mapLocation = computed(() =>
  store.location ? { lat: store.location.lat, lng: store.location.lng } : undefined,
)

const locationFrom = computed(() => {
  const messages: Record<AddressSource, string> = {
    image: 'Possible address based on photo',
    search: 'From address search',
    geoLocation: 'Possible address based on geolocation',
    mapPin: 'Nearest address to pin location',
  }
  return !addressSource.value ? addressSource.value : messages[addressSource.value]
})

const hasLocation = computed(
  () => store.location?.streetAddress || (store.location?.lat && store.location.lng),
)

function onOutOfBounds() {
  locationError.value = '311 only handles requests in Philadelphia.'
}

async function onMove({ lat, lng }: { lat: number; lng: number }) {
  if (isInPhilly(lat, lng)) {
    currentSearch.value = 'mapPin'
    try {
      const feature = await reverseGeocode(lat, lng)
      if (feature && currentSearch.value === 'mapPin') {
        store.setLocation(feature)
        addressSource.value = 'mapPin'
        return
      }
    } catch {
      locationError.value = 'Failed to get address from map pin location'
    } finally {
      currentSearch.value = null
    }
    if (store.location) {
      store.setLocation({ ...store.location, lat, lng })
      if (isInPhilly(lat, lng)) locationError.value = ''
    }
  }
}

function resetLocation() {
  store.setLocation(undefined)
  addressSource.value = undefined
}

function handleSearch(result: AisFeature | null) {
  if (result) {
    searchReturnedNull.value = false
    store.setLocation(result)
  } else {
    searchReturnedNull.value = true
  }
}

onBeforeMount(() => {
  if (store.photo.location) {
    store.setLocation(store.photo.location)
    addressSource.value = 'image'
  }
})
</script>

<template>
  <ReportStep :step-title="stepTitle" :error-active="false" :required="true">
    <template #step-content>
      <div
        class="location-step"
        :style="{ 'row-gap': errorMessage ? 'var(--spacing-xs, 0.5rem)' : '0' }"
      >
        <div
          class="location-step__error"
          :style="{ 'padding-bottom': errorMessage ? 'var(--spacing-xs, 0.5rem)' : '0' }"
        >
          <Callout v-if="wizardError && !isValidLocation" :title="errorMessage" :type="'error'" />
        </div>
        <LocationMap
          class="location-step__map"
          :location="mapLocation"
          :popup-text="locationFrom"
          :service-type="store.category"
          :address="store.location"
          :img-src="store.photo.mediaUrl"
          @move="onMove"
          @out-of-bounds="onOutOfBounds"
        />
        <AddressSearch
          v-model:current-search="currentSearch"
          v-model:address-source="addressSource"
          v-model:location-error="locationError"
          class="location-step__search"
          @select="handleSearch"
        />
        <PhilaButton
          v-if="hasLocation"
          variant="text"
          :icon="IconRotateLeft"
          size="small"
          class="location-step__reset"
          @click="resetLocation"
          >Reset</PhilaButton
        >
        <div class="location-step__readonly">
          <Tags
            v-if="hasLocation"
            text="Click and drag to move pin"
            variant="readonly"
            :icon="IconArrowsUpDownLeftRight"
            selected
          />
        </div>

        <NoAddressDropdown
          v-if="searchIsdNull"
          class="location-step__no-address"
          @reset="resetLocation"
        />
      </div>
    </template>
  </ReportStep>
</template>

<style scoped>
.location-step {
  display: grid;
  grid-template-columns:
    [full-start] var(--spacing-l, 1.5rem)
    [inset-start] 1fr
    [search-col-start] 10ch
    [readonly-col-start] 20ch [readonly-col-end]
    10ch [search-col-end]
    1fr [inset-end]
    var(--spacing-l, 1.5rem) [full-end];
  grid-template-rows:
    [error-row]
    auto
    [map-start]
    var(--spacing-l, 1.5rem)
    [search-row-start]
    auto
    [search-row-end]
    1fr
    [readonly-row-start]
    auto
    [readonly-row-end]
    var(--spacing-l, 1.5rem)
    [map-end];
  height: 100%;
  width: 100%;
}

.location-step__error {
  grid-column: full-start / full-end;
  grid-row: error-row;
}

.location-step__map {
  grid-column: full-start / full-end;
  grid-row: map-start / map-end;
}

.location-step__search {
  isolation: isolate;
  grid-column: search-col-start / search-col-end;
  grid-row: search-row-start / search-row-end;
  display: grid;
  place-content: center;
  width: 100%;
}

.location-step__reset {
  isolation: isolate;
  grid-column: inset-start / readonly-col-start;
  grid-row: readonly-row-start / readonly-row-end;
  width: fit-content;

  & > :is(.phila-button__stack) > :is(.phila-button__content) > :is(.phila-icon-core) {
    font-size: var(--Icon-Solid-ExtraSmall-font-icon-solid-xs-size, 1rem);
  }
}

.location-step__readonly {
  display: grid;
  isolation: isolate;
  grid-column: readonly-col-start / readonly-col-end;
  grid-row: readonly-row-start / readonly-row-end;
  justify-content: center;
}

.location-step__no-address {
  grid-column: search-col-start / search-col-end;
  grid-row: search-row-end / map-end;
}
</style>
