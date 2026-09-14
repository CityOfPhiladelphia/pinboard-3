<!-- ABOUTME: Modal for editing report visibility and (when signed out) contact info
     from the Review step. Draft state only commits to the store on Apply; Cancel
     discards it. Matches the mobile apps' SubmitRequestSheet: contact info is
     hidden entirely when signed in (the API derives it from the account instead),
     and sharing it is off by default. -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { Modal } from '@phila/phila-ui-modal'
import { useVisibility, Icon } from '@phila/phila-ui-core'
import {
  IconGlobe,
  IconLock,
  IconCheck,
  IconUser,
  IconUpRightFromSquare,
} from '@phila/phila-ui-core/icons'
import { Switch } from '@phila/phila-ui-switch'
import { TextField } from '@phila/phila-ui-text-field'
import { Callout } from '@phila/phila-ui-callout'
import { useAuth } from '@phila/sso-vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

const MODAL_ID = 'review-visibility-contact'
// Must match Modal.vue's own default `group` prop ("modals") — useVisibility's
// registry is keyed by group:id, and Modal calls useVisibility itself with the
// same id, so this instance and Modal's have to agree on the group to control
// the same registry entry. useVisibility's own default group is "global", so
// this can't be left unspecified.
const MODAL_GROUP = 'modals'

const route = useRoute()
const store = useReportSubmissionStore()
const auth = useAuth()
const { setVisibility, setState } = useVisibility({ id: MODAL_ID, group: MODAL_GROUP })

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
  // setVisibility(true) synchronously attaches a document 'click' listener
  // for outsideClickHide. Calling it directly from the Edit button's own
  // click handler attaches that listener *while this same click is still
  // bubbling up to document* — so it immediately catches its own triggering
  // click as an "outside click" and closes the modal the instant it opens.
  // Deferring to a fresh task lets the current click finish bubbling first.
  setTimeout(() => setVisibility(true), 0)
}

function close() {
  setState(MODAL_ID, false)
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
  sessionStorage.setItem('auth:redirectTo', route.fullPath)
  auth.signIn()
}

defineExpose({ open })
</script>

<template>
  <Modal
    :id="MODAL_ID"
    title="Visibility"
    :dissmissible="true"
    :cancellable="true"
    action-label="Apply"
    @submit="apply"
    @cancel="cancel"
  >
    <div class="vc-modal">
      <div class="vc-modal__visibility-group">
        <div class="vc-modal__visibility" role="radiogroup" aria-label="Visibility">
          <button
            type="button"
            class="vc-modal__option"
            role="radio"
            :aria-checked="draftPublic"
            @click="draftPublic = true"
          >
            <Icon :icon="IconGlobe" decorative size="small" />
            <span class="vc-modal__option-text">
              <span class="vc-modal__option-label">Public</span>
              <span class="vc-modal__option-sub">Anyone can see your report</span>
            </span>
            <Icon
              v-if="draftPublic"
              :icon="IconCheck"
              decorative
              size="small"
              class="vc-modal__check"
            />
          </button>
          <button
            type="button"
            class="vc-modal__option"
            role="radio"
            :aria-checked="!draftPublic"
            @click="draftPublic = false"
          >
            <Icon :icon="IconLock" decorative size="small" />
            <span class="vc-modal__option-text">
              <span class="vc-modal__option-label">Private</span>
              <span class="vc-modal__option-sub">Only 311 can see your report</span>
            </span>
            <Icon
              v-if="!draftPublic"
              :icon="IconCheck"
              decorative
              size="small"
              class="vc-modal__check"
            />
          </button>
        </div>
        <p class="vc-modal__note">
          Visibility will not affect what 311 can see. We will always receive your full report
          details.
        </p>
      </div>

      <template v-if="!auth.isAuthenticated.value">
        <h3 class="vc-modal__contact-heading">Contact info</h3>
        <Switch id="vc-modal-share" v-model="draftShare" aria-label="Share contact info with 311">
          <span class="vc-modal__switch-label">Share contact info with 311</span>
        </Switch>

        <template v-if="draftShare">
          <a href="#" class="vc-modal__signin" @click.prevent="signIn">
            <Icon :icon="IconUser" decorative size="small" />
            <span class="vc-modal__signin-label">Sign up / Sign in</span>
            <Icon :icon="IconUpRightFromSquare" decorative size="small" />
          </a>
          <div class="vc-modal__divider">
            <span class="vc-modal__divider-line" />
            <span class="vc-modal__divider-text">Or enter details</span>
            <span class="vc-modal__divider-line" />
          </div>
          <TextField id="vc-modal-name" v-model="draftName" label="Name" placeholder="Full name" />
          <TextField
            id="vc-modal-phone"
            v-model="draftPhone"
            label="Phone Number"
            placeholder="Phone Number"
          />
        </template>
      </template>

      <Callout v-if="errorMessage" type="error" role="alert" :message="errorMessage" />
    </div>
  </Modal>
</template>

<style scoped>
/* Spacing/type below is transcribed from the Figma frame's own resolved
 * token values, not eyeballed. One thing the Figma frame also specifies (a
 * Subtitle/24px dialog title) is Modal.vue's own concern rather than this
 * file's — see conversation. The dialog's 32px outer padding was that too,
 * until .modal-content became its own scroll region (App.vue) — since its
 * scrollbar needs to sit flush with the card's edge rather than inset by a
 * padding on the scroll container itself, that inset moved to this content
 * instead, so .vc-modal's own horizontal padding is now that 32px. */
.vc-modal {
  display: flex;
  flex-direction: column;
  /* Figma's "Content Slot" gap (spacing/xl) between each of these
   * top-level groups: tiles+note, contact-info heading, switch, sign-in
   * card, divider, and (crossing into what Figma calls the "Input Slot")
   * the name/phone fields. */
  gap: var(--spacing-xl, 2rem);
  width: 100%;
  box-sizing: border-box;
  padding: 0 var(--spacing-xl, 2rem);
  /* Modal.vue's own .modal-content and .modal-actions (the Cancel/Apply
   * row) have no gap between them at all — nothing in the package supplies
   * one, so it's this content's own job to leave room before the buttons.
   * Figma's spacing/2xl matches the gap it uses between its own top-level
   * slots (Content/Input/Footer), which this crosses into here. */
  margin-bottom: var(--spacing-2xl, 2.5rem);
}
.vc-modal__visibility-group {
  /* Figma groups the tiles and the note under one tighter gap
   * (spacing/m) rather than the xl gap .vc-modal uses between its other
   * top-level groups. */
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m, 1rem);
}
.vc-modal__visibility {
  display: flex;
  flex-direction: column;
  border-radius: var(--border-radius-l, 1rem);
  /* Figma's "Fills/Secondary" token — not currently shipped as a CSS
   * variable in @phila/phila-ui-core (checked the generated stylesheets),
   * so this is the literal value rather than a var() reference. */
  background: rgba(120, 120, 128, 0.16);
  overflow: hidden;
}
.vc-modal__note {
  /* Body/Large */
  margin: 0;
  font-size: var(--Body-Large-font-body-large-size, 1.125rem);
  line-height: var(--Body-Large-font-body-large-lineheight, 1.75rem);
  color: var(--Schemes-On-Surface-Low, #636363);
}
.vc-modal__option {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  width: 100%;
  padding: var(--spacing-m, 1rem);
  border: none;
  border-bottom: var(--border-width-s, 1px) solid var(--Schemes-Border-low, #ccc);
  background: none;
  text-align: left;
  cursor: pointer;
}
.vc-modal__option:last-child {
  border-bottom: none;
}
.vc-modal__option-text {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-width: 0;
}
.vc-modal__option-label {
  /* Label/Default */
  font-size: var(--Label-Default-font-label-default-size, 1rem);
  line-height: var(--Label-Default-font-label-default-lineheight, 1.5rem);
  font-weight: 600;
}
.vc-modal__option-sub {
  /* Body/Small */
  font-size: var(--Body-Small-font-body-small-size, 0.875rem);
  line-height: var(--Body-Small-font-body-small-lineheight, 1.25rem);
  color: var(--Schemes-On-Surface-Low, #636363);
}
.vc-modal__check {
  flex-shrink: 0;
  color: var(--Schemes-Primary, #2b55db);
}
.vc-modal__contact-heading {
  /* Label/Default */
  margin: 0;
  font-size: var(--Label-Default-font-label-default-size, 1rem);
  line-height: var(--Label-Default-font-label-default-lineheight, 1.5rem);
  font-weight: 600;
}
.vc-modal__switch-label {
  /* Body/Default */
  font-size: var(--Body-Default-font-body-default-size, 1.125rem);
  line-height: var(--Body-Default-font-body-default-lineheight, 1.75rem);
}
.vc-modal__signin {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  width: fit-content;
  padding: var(--spacing-2xs, 0.25rem) var(--spacing-m, 1rem);
  border: var(--border-width-s, 1px) solid var(--Schemes-Border-low, #ccc);
  border-radius: var(--border-radius-s, 0.5rem);
  color: inherit;
  text-decoration: none;
}
.vc-modal__signin-label {
  /* Label/Default */
  font-size: var(--Label-Default-font-label-default-size, 1rem);
  line-height: var(--Label-Default-font-label-default-lineheight, 1.5rem);
  font-weight: 600;
}
.vc-modal__divider {
  display: flex;
  align-items: center;
  gap: var(--spacing-m, 1rem);
}
.vc-modal__divider-line {
  flex: 1 1 0;
  height: 1px;
  background: var(--Schemes-Border-low, #ccc);
}
.vc-modal__divider-text {
  /* Body/Small */
  font-size: var(--Body-Small-font-body-small-size, 0.875rem);
  line-height: var(--Body-Small-font-body-small-lineheight, 1.25rem);
  color: var(--Schemes-On-Surface-Low, #636363);
  white-space: nowrap;
}
</style>
