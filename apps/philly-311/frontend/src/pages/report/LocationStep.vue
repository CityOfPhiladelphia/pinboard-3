<!-- ABOUTME: Wizard step 3 — location. AIS address search is primary; a persistent
     map shows the chosen point with a draggable pin; "Use my current location" uses
     browser geolocation. Stores a complete WizardLocation; Next gated on in-Philly. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { reverseGeocode, type AisFeature } from '@/composables/useAis'
// import { getCurrentPosition } from '@/composables/useGeolocation'
import { useWizardValidity } from '@/composables/useWizardValidity'
import { isInPhilly } from '@/utils/bounds'
// import { PhilaButton } from '@phila/phila-ui-button'
// import AddressSearch from '@/components/wizard/AddressSearch.vue'
import LocationMap from '@/components/wizard/LocationMap.vue'
import ReportStep from './ReportStep.vue'

const store = useReportSubmissionStore()
const error = ref<string | null>(null)
// const lookingUp = ref(false)

const stepTitle = 'Confirm location * (required)'

const isValidLocation = computed(
  () => !!store.location && isInPhilly(store.location.lat, store.location.lng),
)
useWizardValidity(isValidLocation)
// const showErrors = useWizardErrors()

// Each location intent increments this counter so that stale async resolutions
// (slow geocodes, late geolocation callbacks) never clobber a newer selection.
let intent = 0

const mapLocation = computed(() =>
  store.location ? { lat: store.location.lat, lng: store.location.lng } : null,
)

function onSelect(f: AisFeature) {
  intent++
  store.setLocation({ address: f.streetAddress, zipCode: f.zipCode, lat: f.lat, lng: f.lng })
  if (isInPhilly(f.lat, f.lng)) error.value = null
}

function onOutOfBounds() {
  error.value = '311 only handles requests in Philadelphia.'
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
    if (isInPhilly(lat, lng)) error.value = null
  }
}

// async function useMyLocation() {
//   const my = ++intent
//   lookingUp.value = true
//   error.value = null
//   try {
//     const pos = await getCurrentPosition()
//     if (my !== intent) return
//     if (!pos) {
//       error.value = "We couldn't access your location. Type an address instead."
//       return
//     }
//     const feature = await reverseGeocode(pos.lat, pos.lng)
//     if (my !== intent) return
//     if (feature) onSelect(feature)
//     else error.value = "We couldn't resolve your location to an address."
//   } catch {
//     if (my !== intent) return
//     error.value = "We couldn't resolve your location to an address."
//   } finally {
//     lookingUp.value = false
//   }
// }
</script>

<template>
  <ReportStep :step-title="stepTitle">
    <template #step-content>
      <div class="location-step">
        <LocationMap :location="mapLocation" @move="onMove" @out-of-bounds="onOutOfBounds" />
      </div>
    </template>
  </ReportStep>
</template>

<style scoped>
.location-step {
  display: grid;
  height: 100%;
}
</style>
