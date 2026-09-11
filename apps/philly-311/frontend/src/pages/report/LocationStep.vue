<!-- ABOUTME: Wizard step 3 — location. AIS address search is primary; a persistent
     map shows the chosen point with a draggable pin; "Use my current location" uses
     browser geolocation. Stores a complete AisFeature; Next gated on in-Philly. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { reverseGeocode } from '@/composables/useAis'
// import { getCurrentPosition } from '@/composables/useGeolocation'
import { useWizardValidity, useWizardErrors } from '@/composables/useWizardValidity'
import { isInPhilly } from '@/utils/bounds'
import { Callout } from '@phila/phila-ui-callout'
import { Search } from '@phila/phila-ui-search'
import { PhilaButton } from '@phila/phila-ui-button'
import { Tags } from '@phila/phila-ui-tags'
import {
  IconRotateLeft,
  IconArrowsUpDownLeftRight,
  IconLocationDot,
} from '@phila/phila-ui-core/icons'
// import AddressSearch from '@/components/wizard/AddressSearch.vue'
import LocationMap from '@/components/wizard/LocationMap.vue'
import ReportStep from '@/components/wizard/ReportStep.vue'
import type { AisFeature } from '@/types/wizard'

type AddressSource = 'image' | 'search' | 'geoLocation'

const stepTitle = 'Confirm Location'
const defaultError = 'Choose an address to continue'

const store = useReportSubmissionStore()
const errorMessage = ref('')
const locationError = ref('')
const addressSource = ref<AddressSource | undefined>(store.photo.mediaUrl ? 'image' : undefined)
// const lookingUp = ref(false)

const isValidLocation = computed(
  () => !!store.location && isInPhilly(store.location.lat, store.location.lng),
)
useWizardValidity(isValidLocation)
const wizardError = useWizardErrors()

watch([locationError, wizardError], ([newLocationError, newWizardError]) => {
  errorMessage.value = (newWizardError ? defaultError : newLocationError) ?? ''
})

// Each location intent increments this counter so that stale async resolutions
// (slow geocodes, late geolocation callbacks) never clobber a newer selection.
let intent = 0

const mapLocation = computed(() =>
  store.location ? { lat: store.location.lat, lng: store.location.lng } : undefined,
)

const locationFrom = computed(() => {
  const messages: Record<AddressSource, string> = {
    image: 'Possible address from photo',
    search: 'Address search',
    geoLocation: 'Geolocation',
  }
  return !addressSource.value ? addressSource.value : messages[addressSource.value]
})

function onSelect(f: AisFeature) {
  intent++
  store.setLocation(f)
  if (isInPhilly(f.lat, f.lng)) locationError.value = ''
}

function onOutOfBounds() {
  locationError.value = '311 only handles requests in Philadelphia.'
}

async function onMove({ lat, lng }: { lat: number; lng: number }) {
  const my = ++intent
  try {
    const feature = await reverseGeocode(lat, lng)
    if (my !== intent) return
    if (feature) {
      onSelect(feature)
      return
    }
  } catch {
    if (my !== intent) return
    /* fall through to the coords-only update */
  }
  if (store.location) {
    store.setLocation({ ...store.location, lat, lng })
    if (isInPhilly(lat, lng)) locationError.value = ''
  }
}

function resetLocation() {
  store.setLocation(null)
  console.log('CLICK!')
}
// async function useMyLocation() {
//   const my = ++intent
//   lookingUp.value = true
//   locationError.value = ''
//   try {
//     const pos = await getCurrentPosition()
//     if (my !== intent) return
//     if (!pos) {
//       locationError.value = "We couldn't access your location. Type an address instead."
//       return
//     }
//     const feature = await reverseGeocode(pos.lat, pos.lng)
//     if (my !== intent) return
//     if (feature) onSelect(feature)
//     else locationError.value = "We couldn't resolve your location to an address."
//   } catch {
//     if (my !== intent) return
//     locationError.value = "We couldn't resolve your location to an address."
//   } finally {
//     lookingUp.value = false
//   }
// }
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
          :address="store.location?.streetAddress"
          :img-src="store.photo.mediaUrl"
          @move="onMove"
          @out-of-bounds="onOutOfBounds"
        />
        <Search
          :placeholder="store.location?.streetAddress ?? 'Enter an address, intersection, or place'"
          :elevated="true"
          :leading-icon="IconLocationDot"
          class="location-step__overlay location-step__search"
        />
        <PhilaButton
          v-if="store.location?.streetAddress"
          variant="text"
          :icon="IconRotateLeft"
          size="small"
          class="location-step__overlay location-step__reset"
          @click="resetLocation"
          >Reset</PhilaButton
        >
        <Tags
          text="Click and drag to move pin"
          variant="readonly"
          :icon="IconArrowsUpDownLeftRight"
          selected
          class="location-step__overlay location-step__readonly"
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
    [search-col-start] auto
    [readonly-col-start] auto [readonly-col-end]
    auto [search-col-end]
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

.location-step__overlay {
  isolation: isolate;
}

.location-step__search {
  grid-column: search-col-start / search-col-end;
  grid-row: search-row-start / search-row-end;
  width: 100%;
}

.location-step__reset {
  grid-column: inset-start / readonly-col-start;
  grid-row: readonly-row-start / readonly-row-end;
  width: fit-content;

  & > * :is(.phila-icon-core) {
    font-size: var(--Icon-Solid-ExtraSmall-font-icon-solid-xs-size, 1rem);
  }
}

.location-step__readonly {
  grid-column: readonly-col-start / readonly-col-end;
  grid-row: readonly-row-start / readonly-row-end;
  width: 100%;
}
</style>
