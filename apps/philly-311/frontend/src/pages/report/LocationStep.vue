<!-- ABOUTME: Wizard step 3 — location. AIS address search is primary; a persistent
     map shows the chosen point with a draggable pin; "Use my current location" uses
     browser geolocation. Stores a complete WizardLocation; Next gated on in-Philly. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { reverseGeocode, type AisFeature } from '@/composables/useAis'
import { getCurrentPosition } from '@/composables/useGeolocation'
import { useWizardValidity } from '@/composables/useWizardValidity'
import { isInPhilly } from '@/utils/bounds'
import PillButton from '@/components/PillButton.vue'
import AddressSearch from '@/components/wizard/AddressSearch.vue'
import LocationMap from '@/components/wizard/LocationMap.vue'

const store = useReportSubmissionStore()
const error = ref<string | null>(null)
const lookingUp = ref(false)

useWizardValidity(
  computed(() => !!store.location && isInPhilly(store.location.lat, store.location.lng)),
)

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

async function useMyLocation() {
  const my = ++intent
  lookingUp.value = true
  error.value = null
  try {
    const pos = await getCurrentPosition()
    if (my !== intent) return
    if (!pos) {
      error.value = "We couldn't access your location. Type an address instead."
      return
    }
    const feature = await reverseGeocode(pos.lat, pos.lng)
    if (my !== intent) return
    if (feature) onSelect(feature)
    else error.value = "We couldn't resolve your location to an address."
  } catch {
    if (my !== intent) return
    error.value = "We couldn't resolve your location to an address."
  } finally {
    lookingUp.value = false
  }
}
</script>

<template>
  <div class="location-step">
    <h1 class="location-step__title">
      Location <span class="location-step__required">* (required)</span>
    </h1>

    <div class="location-step__columns">
      <div class="location-step__form">
        <AddressSearch @select="onSelect" />
        <PillButton
          variant="outline"
          class="location-step__geolocate"
          data-test="use-my-location"
          :disabled="lookingUp"
          @click="useMyLocation"
        >
          {{ lookingUp ? 'Locating…' : 'Use my current location' }}
        </PillButton>
        <p v-if="store.location" class="location-step__chosen" data-test="chosen-address">
          <strong>{{
            store.location.address || `${store.location.lat}, ${store.location.lng}`
          }}</strong>
        </p>
        <p v-if="error" class="location-step__error" role="alert">{{ error }}</p>
      </div>

      <LocationMap :location="mapLocation" @move="onMove" @out-of-bounds="onOutOfBounds" />
    </div>
  </div>
</template>

<style scoped>
.location-step__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-m, 1rem);
}
.location-step__required {
  font-weight: 400;
  color: var(--ui-color-grey-700, #4a4a4a);
  font-size: 1rem;
}
.location-step__columns {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  gap: var(--spacing-m, 1rem);
  align-items: start;
}
.location-step__geolocate {
  margin-top: var(--spacing-s, 0.75rem);
}
.location-step__chosen {
  margin: var(--spacing-s, 0.75rem) 0 0;
}
.location-step__error {
  margin: var(--spacing-s, 0.75rem) 0 0;
  color: var(--ui-color-red, #c0392b);
}
@media (max-width: 768px) {
  .location-step__columns {
    grid-template-columns: 1fr;
  }
}
</style>
