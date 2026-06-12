<!-- ABOUTME: Landing-header callout: heading + lede + the primary "Start a report" CTA
     routing to /report. -->
<script setup lang="ts"></script>

<template>
  <section class="report-callout">
    <h2 class="report-callout__title">Report Issues Around You</h2>
    <p class="report-callout__lede">
      See something that needs attention? Report it and help improve neighborhoods across
      Philadelphia.
    </p>
    <RouterLink to="/report" class="report-callout__cta">Start a report</RouterLink>
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
.report-callout__cta {
  display: inline-block;
  padding: var(--spacing-s, 0.75rem) var(--spacing-m, 1rem);
  background: var(--ui-color-primary, #0f4d90);
  color: #fff;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
}
</style>
