<!-- ABOUTME: The visibility/contact form fields shown by VisibilityContactModal,
     factored out so its desktop (Modal) and mobile (BottomSheet) presentations
     can share this content instead of duplicating it in both template branches. -->
<script setup lang="ts">
import { Icon } from '@phila/phila-ui-core'
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

defineProps<{
  isPublic: boolean
  share: boolean
  name: string
  phone: string
  isAuthenticated: boolean
  errorMessage: string | null
}>()

const emit = defineEmits<{
  'update:isPublic': [value: boolean]
  'update:share': [value: boolean]
  'update:name': [value: string]
  'update:phone': [value: string]
  signIn: []
}>()
</script>

<template>
  <div class="vc-modal">
    <div class="vc-modal__visibility-group">
      <div class="vc-modal__visibility" role="radiogroup" aria-label="Visibility">
        <button
          type="button"
          class="vc-modal__option"
          role="radio"
          :aria-checked="isPublic"
          @click="emit('update:isPublic', true)"
        >
          <Icon :icon="IconGlobe" decorative size="small" />
          <span class="vc-modal__option-text">
            <span class="vc-modal__option-label">Public</span>
            <span class="vc-modal__option-sub">Anyone can see your report</span>
          </span>
          <Icon v-if="isPublic" :icon="IconCheck" decorative size="small" class="vc-modal__check" />
        </button>
        <button
          type="button"
          class="vc-modal__option"
          role="radio"
          :aria-checked="!isPublic"
          @click="emit('update:isPublic', false)"
        >
          <Icon :icon="IconLock" decorative size="small" />
          <span class="vc-modal__option-text">
            <span class="vc-modal__option-label">Private</span>
            <span class="vc-modal__option-sub">Only 311 can see your report</span>
          </span>
          <Icon
            v-if="!isPublic"
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

    <template v-if="!isAuthenticated">
      <h3 class="vc-modal__contact-heading">Contact info</h3>
      <Switch
        id="vc-modal-share"
        :model-value="share"
        aria-label="Share contact info with 311"
        @update:model-value="emit('update:share', $event as boolean)"
      >
        <span class="vc-modal__switch-label">Share contact info with 311</span>
      </Switch>

      <template v-if="share">
        <a href="#" class="vc-modal__signin" @click.prevent="emit('signIn')">
          <Icon :icon="IconUser" decorative size="small" />
          <span class="vc-modal__signin-label">Sign up / Sign in</span>
          <Icon :icon="IconUpRightFromSquare" decorative size="small" />
        </a>
        <div class="vc-modal__divider">
          <span class="vc-modal__divider-line" />
          <span class="vc-modal__divider-text">Or enter details</span>
          <span class="vc-modal__divider-line" />
        </div>
        <TextField
          id="vc-modal-name"
          :model-value="name"
          label="Name"
          placeholder="Full name"
          @update:model-value="emit('update:name', $event)"
        />
        <TextField
          id="vc-modal-phone"
          :model-value="phone"
          label="Phone Number"
          placeholder="Phone Number"
          @update:model-value="emit('update:phone', $event)"
        />
      </template>
    </template>

    <Callout v-if="errorMessage" type="error" role="alert" :message="errorMessage" />
  </div>
</template>

<style scoped>
.vc-modal {
  display: flex;
  flex-direction: column;
  /* Figma's "Content Slot" gap (spacing/xl) between each of these
   * top-level groups: tiles+note, contact-info heading, switch, sign-in
   * card, divider, and (crossing into what Figma calls the "Input Slot")
   * the name/phone fields. */
  gap: var(--spacing-xl, 2rem);
  width: 100%;
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
