<!-- ABOUTME: Modal for editing report visibility and (when signed out) contact info
     from the Review step. Draft state only commits to the store on Apply; Cancel
     discards it. Matches the mobile apps' SubmitRequestSheet: contact info is
     hidden entirely when signed in (the API derives it from the account instead),
     and sharing it is off by default.

     Chrome (desktop Modal vs. mobile BottomSheet, and everything that takes to
     make the latter behave like a dialog) is ResponsiveModal's concern, not
     this file's — this only owns the draft state and validation. -->
<script setup lang="ts">
import { computed, ref, useId, useTemplateRef, type Ref } from 'vue'
import { useReportSubmissionStore, type LocationField } from '@/stores/reportSubmission'
import ResponsiveModal from '@/components/ResponsiveModal.vue'
import { TextField } from '@phila/phila-ui-text-field'

const MODAL_ID = `manual-address-entry-${useId()}`

const store = useReportSubmissionStore()
const modal = useTemplateRef('modal')

type ErrorType = Exclude<LocationField, 'unit'>

const errors: Record<ErrorType, string> = {
  streetAddress: 'Please enter a street address.',
  city: 'Please enter city name.',
  state: 'Please enter state.',
  zipCode: 'Please enter zipcode.',
}
// Draft state: seeded from the store on open, only committed on Apply.
const draftAddress = ref(store.location?.streetAddress)
const draftUnit = ref(store.location?.unit)
const draftCity = ref(store.location?.city)
const draftState = ref(store.location?.state)
const draftZipcode = ref(store.location?.zipCode)

const errorFields = ref<Record<ErrorType, boolean>>({
  streetAddress: false,
  city: false,
  state: false,
  zipCode: false,
})

const addressError = computed(() => getError('streetAddress'))
const cityError = computed(() => getError('city'))
const stateError = computed(() => getError('state'))
const zipcodeError = computed(() => getError('zipCode'))

function setError(error: ErrorType) {
  errorFields.value[error] = true
}

function getError(error: ErrorType) {
  return errorFields.value[error] ? errors[error] : undefined
}

function processEntry(input: Ref<string | undefined>, error?: ErrorType) {
  const trimmed = input.value?.trim()
  if (!trimmed && error) {
    setError(error)
    return
  }
  if (error) {
    errorFields.value[error] = false
  }
  input.value = trimmed
}

function open() {
  draftAddress.value = store.location?.streetAddress
  draftUnit.value = store.location?.unit
  draftCity.value = store.location?.city
  draftState.value = store.location?.state
  draftZipcode.value = store.location?.zipCode
  modal.value?.open()
}

function close() {
  modal.value?.close()
}

function cancel() {
  close()
}

function apply() {
  processEntry(draftAddress, 'streetAddress')
  processEntry(draftUnit)
  processEntry(draftCity, 'city')
  processEntry(draftState, 'state')
  processEntry(draftZipcode, 'zipCode')

  if (!Object.values(errorFields.value).some((error) => error)) {
    store.setLocation({
      streetAddress: draftAddress.value ?? '',
      unit: draftAddress.value ?? '',
      city: draftCity.value ?? '',
      state: draftState.value ?? '',
      zipCode: draftZipcode.value ?? '',
    })
    close()
  }
}

defineExpose({ open })
</script>

<template>
  <ResponsiveModal
    :id="MODAL_ID"
    ref="modal"
    title="Address details"
    dismissible
    cancellable
    action-label="Apply"
    @submit="apply"
    @cancel="cancel"
  >
    <div>
      <span v-text="'Complete details for the address before continuing'" />
      <fieldset class="address-input-fields">
        <TextField
          v-model="draftAddress"
          label="Street address"
          :placeholder="draftAddress"
          :error="addressError"
        />
        <TextField
          v-model="draftUnit"
          label="Apartment, suite, unit, etc."
          :placeholder="draftUnit"
        />
        <TextField
          v-model="draftCity"
          label="City/town"
          :placeholder="draftCity"
          :error="cityError"
        />
        <TextField
          v-model="draftState"
          label="State"
          :placeholder="draftState"
          :error="stateError"
        />
        <TextField
          v-model="draftZipcode"
          label="Zip Code"
          :placeholder="draftZipcode"
          :error="zipcodeError"
        />
      </fieldset>
    </div>
  </ResponsiveModal>
</template>

<style scoped>
.address-input-fields {
  display: grid;
  border: none;
  row-gap: var(--spacing-2xl, 2.5rem);
  padding: var(--spacing-2xl, 2.5rem) 0;
}
</style>
