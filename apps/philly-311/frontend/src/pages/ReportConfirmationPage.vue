<!-- ABOUTME: Post-submit confirmation — shows the case reference number and
     CTAs to start another report or browse nearby reports. -->
<script setup lang="ts">
import { onMounted, nextTick, ref } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { PhilaButton } from '@phila/phila-ui-button'
import { Callout } from '@phila/phila-ui-callout'

const store = useReportSubmissionStore()
const heading = ref<HTMLElement | null>(null)

onMounted(async () => {
  await nextTick()
  heading.value?.focus()
})
</script>

<template>
  <div class="confirmation">
    <Callout class="confirmation__status" type="success" role="status">
      <h1 ref="heading" tabindex="-1" class="confirmation__title">
        Thanks — your report was submitted.
      </h1>
      <p v-if="store.submitted" class="confirmation__ref">
        Reference number:
        <strong>{{ store.submitted.caseNumber || store.submitted.id }}</strong>
      </p>
    </Callout>
    <div class="confirmation__actions">
      <PhilaButton variant="primary" to="/report">Report another issue</PhilaButton>
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
.confirmation__link {
  color: var(--Schemes-Primary, #0f4d90);
}
</style>
