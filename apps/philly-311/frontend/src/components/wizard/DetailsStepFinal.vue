<!-- ABOUTME: Wizard step 4 — details: walks the issue type's questions one per
     screen (auto-advancing single-choice answers), ending with the required
     description (10-char floor), contact info, and report visibility. -->
<script setup lang="ts">
import ReportStep from './ReportStep.vue'

const isRequired = true

const description = defineModel<string>('description')
const error = defineModel<string>('error')
</script>

<template>
  <ReportStep :step-title="'Describe the issue'" :error-active="false" :required="isRequired">
    <template #step-content>
      <div class="details-step">
        <textarea
          v-model="description"
          class="details-step__textarea"
          :class="{ 'details-step__textarea--error': !!error }"
          rows="4"
          :aria-required="isRequired"
          aria-describedby="details-description-hint"
        ></textarea>

        <p v-if="error" class="details-step__error" role="alert">{{ error }}</p>
      </div>
    </template>
  </ReportStep>
</template>

<style scoped>
.details-step__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid var(--Schemes-Border, #a1a1a1);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
}

.details-step__error {
  margin: 4px 0 0;
  color: var(--Schemes-On-Error-Container, #992100);
  font-weight: 600;
}

.details-step__textarea--error {
  border-color: var(--Schemes-On-Error-Container, #992100);
}
</style>
