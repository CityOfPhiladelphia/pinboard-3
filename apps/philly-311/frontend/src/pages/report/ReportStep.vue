<!-- ABOUTME: Wizard step 1 — optional photo. Upload/Camera -> processForClassify -> /classify,
     which stores the report (mediaUrl) and returns issue-type suggestions for step 2. Optional;
     Skip/Next both advance. -->
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
    <div />
    <p v-if="stepNote" class="report-step__note" v-text="stepNote" />
    <div v-if="stepNote" />
  </div>
  <slot name="step-content" />
</template>

<style scoped>
.report__step {
  display: grid;
  grid-template-areas:
    'title'
    'gap-title'
    'note'
    'gap-note';
  grid-auto-rows: auto var(--spacing-xs, 0.5rem);
  row-gap: 0;
}

.report-step__title {
  grid-area: title;
  display: grid;
  /* Heading/H5 */
  color: #374151;
}

.report-step__note {
  grid-area: note;
  max-width: 39rem;
  margin-bottom: 0px !important;
  color: #374151;
}
</style>
