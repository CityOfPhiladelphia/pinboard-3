<!-- ABOUTME: Modal for editing report visibility and (when signed out) contact info
     from the Review step. Draft state only commits to the store on Apply; Cancel
     discards it. Matches the mobile apps' SubmitRequestSheet: contact info is
     hidden entirely when signed in (the API derives it from the account instead),
     and sharing it is off by default.

     Chrome (desktop Modal vs. mobile BottomSheet, and everything that takes to
     make the latter behave like a dialog) is ResponsiveModal's concern, not
     this file's — this only owns the draft state and validation. -->
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@phila/sso-vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import ResponsiveModal from '@/components/ResponsiveModal.vue'
import VisibilityContactFields from './VisibilityContactFields.vue'

const MODAL_ID = 'review-visibility-contact'

const route = useRoute()
const store = useReportSubmissionStore()
const auth = useAuth()
const modal = useTemplateRef('modal')

// Draft state: seeded from the store on open, only committed on Apply.
const draftPublic = ref(store.publicVisibility)
const draftShare = ref(store.shareContactInfo)
const draftName = ref(store.contact.name ?? '')
const draftPhone = ref(store.contact.phone ?? '')
const errorMessage = ref<string | null>(null)

function open() {
  draftPublic.value = store.publicVisibility
  draftShare.value = store.shareContactInfo
  draftName.value = store.contact.name ?? ''
  draftPhone.value = store.contact.phone ?? ''
  errorMessage.value = null
  modal.value?.open()
}

function close() {
  modal.value?.close()
}

function cancel() {
  close()
}

function apply() {
  errorMessage.value = null
  const sharing = draftShare.value && !auth.isAuthenticated.value
  if (sharing) {
    const trimmedName = draftName.value.trim()
    if (!trimmedName) {
      errorMessage.value = 'Please enter your name.'
      return
    }
    const digits = draftPhone.value.replace(/\D/g, '')
    if (digits.length !== 10) {
      errorMessage.value = 'Please enter a valid 10-digit phone number.'
      return
    }
    draftName.value = trimmedName
    draftPhone.value = digits
  }
  store.setPrivacy(draftPublic.value)
  store.setShareContactInfo(sharing)
  if (!auth.isAuthenticated.value) {
    store.setContact({ name: draftName.value, phone: draftPhone.value })
  }
  close()
}

function signIn() {
  // The SSO round-trip is a full page reload, which wipes this in-memory
  // store — encode its current state into the redirect URL's query so
  // wizardGuard (router/index.ts) rehydrates it on the way back, the same
  // way it does for an external deep link.
  const query = store.stateToUrlQueryParams()
  const path = route.fullPath.split('?')[0]
  sessionStorage.setItem('auth:redirectTo', query ? `${path}?${query}` : path)
  auth.signIn()
}

defineExpose({ open })
</script>

<template>
  <ResponsiveModal
    :id="MODAL_ID"
    ref="modal"
    title="Visibility"
    dismissible
    cancellable
    action-label="Apply"
    @submit="apply"
    @cancel="cancel"
  >
    <VisibilityContactFields
      v-model:is-public="draftPublic"
      v-model:share="draftShare"
      v-model:name="draftName"
      v-model:phone="draftPhone"
      :is-authenticated="auth.isAuthenticated.value"
      :error-message="errorMessage"
      @sign-in="signIn"
    />
  </ResponsiveModal>
</template>
