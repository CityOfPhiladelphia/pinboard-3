<!-- ABOUTME: Template for report pages. Standardizes step headings -->
<script setup lang="ts">
// props
defineProps<{
  stepTitle: string
  stepNote?: string
}>()

// slots
defineSlots<{
  'step-content'?: unknown
}>()
</script>

<template>
  <div class="report__step">
    <h5 class="report-step__title" v-text="stepTitle" />
    <p class="report-step__note" v-text="stepNote" />
    <div class="report-step__content">
      <slot name="step-content" />
    </div>
  </div>
</template>

<style scoped>
.report__step {
  display: grid;
  height: 100%;
  grid-template-areas:
    'title'
    'note'
    'content-slot';
  grid-auto-rows: auto auto 1fr;
  row-gap: var(--spacing-xs, 0.5rem);
}

.report-step__title {
  grid-area: title;
  color: #374151;
}

.report-step__note {
  grid-area: note;
  max-width: 39rem;
  margin-bottom: 0px !important;
  color: #374151;
}

.report-step__content {
  grid-area: content-slot;
  overflow: hidden;
}
</style>
