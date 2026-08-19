<!-- ABOUTME: Landing-header callout: heading + lede + the primary "Submit request" CTA
     routing to /report. The CTA used to carry its own document illustration, but that
     glyph now lives on the header's "Report an issue" link, so it's dropped here. -->
<script setup lang="ts">
import { PhilaButton } from '@phila/phila-ui-button'
</script>

<template>
  <section class="report-callout">
    <h2 class="report-callout__title">Submit a report to 311</h2>
    <p class="report-callout__lede">
      Let us know if there's a non-emergency issue that needs attention. The Philly311 team will
      direct your report to the right department.
      <a
        class="report-callout__about-link"
        href="https://www.phila.gov/departments/philly311/"
        target="_blank"
        rel="noopener"
        >About Philly311.</a
      >
    </p>
    <PhilaButton variant="primary" size="large" to="/report" class="report-callout__cta">
      Submit request
    </PhilaButton>
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
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
}
.report-callout__about-link {
  color: var(--Schemes-Primary, #1034f4);
  font-weight: 700;
  text-decoration: underline;
}
.report-callout__cta {
  width: 100%;
  max-width: none;
}
</style>
