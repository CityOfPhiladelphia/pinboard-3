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
// import { PhilaButton } from '@phila/phila-ui-button'
// import AddressSearch from '@/components/wizard/AddressSearch.vue'
import LocationMap from '@/components/wizard/LocationMap.vue'
import ReportStep from '@/components/wizard/ReportStep.vue'
import type { AisFeature } from '@/types/wizard'

const stepTitle = 'Confirm Location'
const defaultError = 'Choose an address to continue'

const store = useReportSubmissionStore()
const errorMessage = ref('')
const locationError = ref('')
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
  store.location ? { lat: store.location.lat, lng: store.location.lng } : null,
)

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
          @move="onMove"
          @out-of-bounds="onOutOfBounds"
        />
      </div>
    </template>
  </ReportStep>
</template>

<style scoped>
.location-step {
  display: grid;
  height: 100%;
  width: 100%;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: auto 1fr;
}

.location-step__error {
  grid-column: 1 / -1;
  grid-row: 1;
}

.location-step__map {
  grid-column: 1 / -1;
  grid-row: 2;
  overflow: hidden;
}
</style>
