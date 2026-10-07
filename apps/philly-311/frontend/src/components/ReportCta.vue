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
  position: relative;
  padding: var(--spacing-m, 1rem) var(--spacing-l, 1.5rem);
}

.report-cta::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.64) var(--spacing-m, 1rem)
  );
  mask-image: linear-gradient(to bottom, transparent 0, #000 var(--spacing-m, 1rem));
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 var(--spacing-m, 1rem));
}
.report-cta__button {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: none;
}
</style>
