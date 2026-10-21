<!-- ABOUTME: Landing-header callout: heading + lede intro copy. Used to also carry the
     primary "Submit request" CTA, but that's now a floating "Report an issue" button
     overlaying the bottom of the locations panel instead (see ReportCta.vue) — the CTA's
     document illustration lives on the header's "Report an issue" nav link, unrelated. -->
<script setup lang="ts">
const titleText = 'Submit a report to 311'
const calloutText =
  "Let us know if there's a non-emergency issue that needs attention. The Philly311 team will direct your report to the right department."
const linkText = 'About Philly311.'
</script>

<template>
  <section class="report-callout">
    <div class="has-text-heading-5" v-text="titleText" />
    <p class="has-text-body-small">
      {{ calloutText }}
      <a
        class="report-callout__about-link has-text-link-small has-text-underline"
        href="https://www.phila.gov/departments/philly311/"
        target="_blank"
        rel="noopener"
        v-text="linkText"
      />
    </p>
  </section>
</template>

<style scoped>
.report-callout {
  display: flex;
  flex-direction: column;
  color: var(--Schemes-On-Surface-High, #000);
  gap: var(--spacing-xs, 0.5rem);
  padding: var(--spacing-l, 1.5rem) var(--spacing-m, 1rem) 0 var(--spacing-m, 1rem);

  > p {
    margin-bottom: 0;
  }
}

.report-callout__about-link {
  color: var(--Schemes-Primary, #2b55db);
}
</style>
