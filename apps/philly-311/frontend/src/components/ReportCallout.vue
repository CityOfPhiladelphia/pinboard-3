<!-- ABOUTME: Landing-header callout: heading + lede + the primary "Start a report" CTA
     (filled pill with an overlapping document illustration) routing to /report. -->
<script setup lang="ts">
import reportDocument from '@/assets/report-document.svg'
</script>

<template>
  <section class="report-callout">
    <h2 class="report-callout__title">Report Issues Around You</h2>
    <p class="report-callout__lede">
      See something that needs attention? Report it and help improve neighborhoods across
      Philadelphia.
    </p>
    <div class="report-callout__cta-row">
      <RouterLink to="/report" class="report-callout__cta">Start a report</RouterLink>
      <img class="report-callout__cta-icon" :src="reportDocument" alt="" aria-hidden="true" />
    </div>
  </section>
</template>

<style scoped>
.report-callout {
  padding: var(--spacing-m, 1rem);
}
.report-callout__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-xs, 0.5rem);
}
.report-callout__lede {
  margin: 0 0 var(--spacing-s, 0.75rem);
  color: var(--ui-color-grey-700, #4a4a4a);
}
.report-callout__cta-row {
  position: relative;
  display: flex;
}
.report-callout__cta {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 var(--spacing-l, 1.5rem);
  background: var(--ui-color-primary, #1034f4);
  color: #fff;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 1.125rem;
  line-height: 1.75rem;
  text-decoration: none;
  box-shadow:
    0 1px 3px 1px rgba(0, 0, 0, 0.15),
    0 1px 2px 0 rgba(0, 0, 0, 0.3);
}
.report-callout__cta-icon {
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 60px;
  pointer-events: none;
}
</style>
