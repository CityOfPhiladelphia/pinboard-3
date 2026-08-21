<!-- ABOUTME: Wizard step 4 — details: walks the issue type's questions one per
     screen (auto-advancing single-choice answers), ending with the required
     description (10-char floor), contact info, and report visibility. -->
<script setup lang="ts">
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import ContactInfo from '@/components/wizard/ContactInfo.vue'
import ReportStep from './ReportStep.vue'

const store = useReportSubmissionStore()

const description = defineModel<string>('description')
const error = defineModel<string>('error')

function setPrivacy(e: Event) {
  store.setPrivacy((e.target as HTMLInputElement).checked)
}
</script>

<template>
  <ReportStep :step-title="''">
    <template #step-content>
      <div class="details-step">
        <h1 class="details-step__title">Details</h1>

        <label class="details-step__label" for="details-description">
          Describe the issue <span class="details-step__required">* (required)</span>
        </label>
        <textarea
          id="details-description"
          v-model="description"
          class="details-step__textarea"
          :class="{ 'details-step__textarea--error': !!error }"
          rows="4"
          aria-required="true"
          aria-describedby="details-description-hint"
        ></textarea>
        <p id="details-description-hint" class="details-step__hint">At least 10 characters.</p>
        <p v-if="error" class="details-step__error" role="alert">{{ error }}</p>

        <ContactInfo />

        <fieldset class="details-step__privacy">
          <legend class="details-step__privacy-legend">Visibility</legend>
          <label class="details-step__privacy-toggle">
            <input
              type="checkbox"
              :checked="store.publicVisibility"
              aria-describedby="details-privacy-note"
              @change="setPrivacy"
            />
            Make this report public
          </label>
          <p id="details-privacy-note" class="details-step__privacy-note">
            Public reports show up on the map. Off by default; only you and 311 staff see your
            private reports.
          </p>
        </fieldset>
      </div>
    </template>
  </ReportStep>
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
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
  font-size: 0.875rem;
}
.details-step__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid var(--Schemes-Border, #a1a1a1);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
}
.details-step__hint {
  margin: 4px 0 var(--spacing-l, 2rem);
  font-size: 0.875rem;
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
}
.details-step__error {
  margin: 4px 0 0;
  color: var(--Schemes-On-Error-Container, #992100);
  font-weight: 600;
}
.details-step__textarea--error {
  border-color: var(--Schemes-On-Error-Container, #992100);
}
.details-step__retry {
  margin-left: var(--spacing-s, 0.75rem);
}
.details-step__privacy {
  border: 1px solid var(--Schemes-Border-low, #e3e3e3);
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
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
}
</style>
