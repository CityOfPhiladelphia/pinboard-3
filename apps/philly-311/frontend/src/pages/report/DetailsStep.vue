<!-- ABOUTME: Wizard step 4 — details: required description (10-char floor gates Next),
     optional contact info (stored, not yet sent), and report visibility. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useWizardValidity } from '@/composables/useWizardValidity'
import ContactInfo from '@/components/wizard/ContactInfo.vue'

const MIN_DESCRIPTION = 10

const store = useReportSubmissionStore()
const description = ref(store.description)
watch(description, (v) => store.setDescription(v))

useWizardValidity(computed(() => description.value.trim().length >= MIN_DESCRIPTION))

function setPrivacy(e: Event) {
  store.setPrivacy((e.target as HTMLInputElement).checked)
}
</script>

<template>
  <div class="details-step">
    <h1 class="details-step__title">Details</h1>

    <label class="details-step__label" for="details-description">
      Describe the issue <span class="details-step__required">* (required)</span>
    </label>
    <textarea
      id="details-description"
      v-model="description"
      class="details-step__textarea"
      rows="4"
    ></textarea>
    <p class="details-step__hint">At least 10 characters.</p>

    <ContactInfo />

    <fieldset class="details-step__privacy">
      <legend class="details-step__privacy-legend">Visibility</legend>
      <label class="details-step__privacy-toggle">
        <input type="checkbox" :checked="store.publicVisibility" @change="setPrivacy" />
        Make this report public
      </label>
      <p class="details-step__privacy-note">
        Public reports show up on the map. Off by default; only you and 311 staff see your private
        reports.
      </p>
    </fieldset>
  </div>
</template>

<style scoped>
.details-step {
  max-width: 640px;
}
.details-step__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-m, 1rem);
}
.details-step__label {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
}
.details-step__required {
  font-weight: 400;
  color: var(--ui-color-grey-700, #4a4a4a);
  font-size: 0.875rem;
}
.details-step__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid var(--ui-color-grey-400, #a1a1a1);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
}
.details-step__hint {
  margin: 4px 0 var(--spacing-l, 2rem);
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
.details-step__privacy {
  border: 1px solid var(--ui-color-grey-200, #e3e3e3);
  border-radius: 8px;
  padding: var(--spacing-m, 1rem);
  margin: var(--spacing-l, 2rem) 0 0;
}
.details-step__privacy-legend {
  font-weight: 700;
  padding: 0 4px;
}
.details-step__privacy-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.details-step__privacy-note {
  margin: var(--spacing-s, 0.75rem) 0 0;
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
</style>
