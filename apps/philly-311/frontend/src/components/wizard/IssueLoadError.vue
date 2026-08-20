<!-- ABOUTME: Component to allow retry of fetching issues types if initial load fails -->
<script setup lang="ts">
import { computed } from 'vue'
import { useServiceTypes } from '@/composables/useServiceTypes'
import { useWizardValidity } from '@/composables/useWizardValidity'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { PhilaButton } from '@phila/phila-ui-button'

const store = useReportSubmissionStore()
const { error, load } = useServiceTypes()

useWizardValidity(computed(() => !!store.category && !error.value))
</script>

<template>
  <div class="issue-step__error" role="alert">
    <span v-text="error?.message || 'Could not load issue types.'" />
    <PhilaButton
      variant="secondary"
      class="issue-step__retry"
      data-test="retry-types"
      @click="() => load()"
      >Retry</PhilaButton
    >
  </div>
</template>

<style scoped>
.issue-step__error {
  display: grid;
  place-content: center;
  width: fit-content;
  padding: var(--spacing-m, 1rem) var(--scale-700, 3.5rem);
  gap: var(--spacing-m, 1rem);
  border-radius: 0.75rem;
  background: var(--Schemes-Error-Container, #f8c9bd);
  margin: var(--spacing-3xl, 3rem) auto;
}

span {
  color: var(--Schemes-On-Error-Container, #992100);

  /* Label/Default */
  font-family: var(--Label-Default-font-label-default-family, Montserrat);
  font-size: var(--Label-Default-font-label-default-size, 1rem);
  font-style: normal;
  font-weight: 600;
  line-height: var(--Label-Default-font-label-default-lineheight, 1.5rem); /* 150% */
}
</style>
