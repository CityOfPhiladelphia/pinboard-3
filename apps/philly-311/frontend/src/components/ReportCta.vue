<!-- ABOUTME: Floating "Report an issue" CTA — overlays the bottom of the landing
     page's locations panel (Pinboard's locations-footer slot) on a frosted-glass
     bar, per the redesign. Replaces the old inline "Submit request" button that
     used to live at the top of ReportCallout. -->
<script setup lang="ts">
import { PhilaButton } from '@phila/phila-ui-button'
import { IconAdd } from '@phila/phila-ui-core/icons'
</script>

<template>
  <div class="report-cta">
    <PhilaButton
      variant="primary"
      size="large"
      :icon="IconAdd"
      to="/report"
      class="report-cta__button"
    >
      Report an issue
    </PhilaButton>
  </div>
</template>

<style scoped>
.report-cta {
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  background: rgba(255, 255, 255, 0.64);
  padding: var(--spacing-m, 1rem) var(--spacing-l, 1.5rem);
}
.report-cta__button {
  width: 100%;
  max-width: none;
}
</style>
