<!-- ABOUTME: Landing-header callout: heading + lede intro copy. Used to also carry the
     primary "Submit request" CTA, but that's now a floating "Report an issue" button
     overlaying the bottom of the locations panel instead (see ReportCta.vue) — the CTA's
     document illustration lives on the header's "Report an issue" nav link, unrelated. -->
<script setup lang="ts"></script>

<template>
  <section class="report-callout">
    <div class="report-callout__title has-text-heading-5">Submit a report to 311</div>
    <div class="report-callout__lede has-text-body-small">
      Let us know if there's a non-emergency issue that needs attention. The Philly311 team will
      direct your report to the right department.
      <a
        class="report-callout__about-link"
        href="https://www.phila.gov/departments/philly311/"
        target="_blank"
        rel="noopener"
        >About Philly311.</a
      >
    </div>
  </section>
</template>

<style scoped>
.report-callout {
  /* Figma's Header frame: 16px sides, 24px top/bottom — not a uniform inset. */
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.5rem);
  padding: var(--spacing-l, 1.5rem) var(--spacing-m, 1rem);
}
.report-callout__title {
  /* Font comes from .has-text-heading-5 (matches Figma's "Heading/H5" text
     style) — this class only carries what that utility doesn't. */
  margin: 0;
}
.report-callout__lede {
  /* Font comes from .has-text-body-small. */
  margin: 0;
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
}
.report-callout__about-link {
  color: var(--Schemes-Primary, #1034f4);
  font-weight: 700;
  text-decoration: underline;
}
</style>
