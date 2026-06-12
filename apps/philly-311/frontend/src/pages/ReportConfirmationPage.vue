<!-- ABOUTME: Post-submit confirmation — shows the case reference number and
     CTAs to start another report or browse nearby reports. -->
<script setup lang="ts">
import { useReportSubmissionStore } from '@/stores/reportSubmission'

const store = useReportSubmissionStore()
</script>

<template>
  <div class="confirmation">
    <div class="confirmation__status" role="status">
      <h1 class="confirmation__title">Thanks — your report was submitted.</h1>
      <p v-if="store.submitted" class="confirmation__ref">
        Reference number:
        <strong>{{ store.submitted.caseNumber || store.submitted.id }}</strong>
      </p>
    </div>
    <div class="confirmation__actions">
      <RouterLink class="confirmation__cta" to="/report">Report another issue</RouterLink>
      <RouterLink class="confirmation__link" to="/">See reports near you</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.confirmation {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--spacing-l, 2rem) var(--spacing-m, 1rem);
}
.confirmation__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-s, 0.75rem);
}
.confirmation__ref {
  margin: 0;
}
.confirmation__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-m, 1rem);
  margin-top: var(--spacing-l, 2rem);
}
.confirmation__cta {
  padding: var(--spacing-s, 0.5rem) var(--spacing-l, 1.5rem);
  border-radius: 9999px;
  font-weight: 600;
  background: var(--ui-color-primary, #0f4d90);
  color: #fff;
  text-decoration: none;
}
.confirmation__link {
  color: var(--ui-color-primary, #0f4d90);
}
</style>
