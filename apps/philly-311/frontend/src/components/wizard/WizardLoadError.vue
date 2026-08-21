<!-- ABOUTME: Component to allow retry of fetching issues types if initial load fails -->
<script setup lang="ts">
import { useServiceTypes } from '@/composables/useServiceTypes'
import { PhilaButton } from '@phila/phila-ui-button'

defineProps<{
  errorMessage: string
}>()

const { load } = useServiceTypes()
</script>

<template>
  <div class="wizard__error" role="alert">
    <span v-text="errorMessage" />
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
.wizard__error {
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
