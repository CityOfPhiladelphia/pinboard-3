<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PinboardInfoPage } from '@pinboard/ui'

const { t } = useI18n()

const sections = computed(() => [
  { id: 'insurance', title: t('introPage.section2Title') },
  { id: 'insurance-help', title: t('introPage.section25Title') },
  { id: 'language', title: t('introPage.section3Title') },
  { id: 'establishing', title: t('introPage.section4Title') },
  { id: 'updates', title: t('introPage.section5Title') },
])
</script>

<template>
  <PinboardInfoPage back-to="/" :sections="sections">
    <div class="intro-text-container">
      <h1>{{ t('introPage.section1Title') }}</h1>
      <p class="main-description" v-html="t('introPage.p0')" />
    </div>
    <div class="content-container">
      <p v-html="t('introPage.p05')" />
      <p v-html="t('introPage.p1')" />
      <ol>
        <li>{{ t('introPage.ol1.li1') }}</li>
        <li>{{ t('introPage.ol1.li2') }}</li>
        <li>{{ t('introPage.ol1.li3') }}</li>
      </ol>

      <section id="insurance" class="subsection-container">
        <h2 class="has-text-heading-5">{{ t('introPage.section2Title') }}</h2>
        <p v-html="t('introPage.p2')" />
      </section>
      <section id="insurance-help" class="subsection-container">
        <h2 class="has-text-heading-5">{{ t('introPage.section25Title') }}</h2>
        <p v-html="t('introPage.p25')" />
      </section>
      <section id="language" class="subsection-container">
        <h2 class="has-text-heading-5">{{ t('introPage.section3Title') }}</h2>
        <p>{{ t('introPage.p3') }}</p>
      </section>
      <section id="establishing" class="subsection-container">
        <h2 class="has-text-heading-5">{{ t('introPage.section4Title') }}</h2>
        <p>{{ t('introPage.p4') }}</p>
      </section>
      <section id="updates" class="subsection-container">
        <h2 class="has-text-heading-5">{{ t('introPage.section5Title') }}</h2>
        <p>
          {{ t('introPage.p5') }}
          <a
            target="_blank"
            href="https://www.phila.gov/departments/department-of-public-health/about-us/contact-us/#send-us-a-message"
            >{{ t('introPage.feedbackForm') }}</a
          >.
        </p>
      </section>
    </div>
  </PinboardInfoPage>
</template>

<style scoped>
.intro-text-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-s, 0.75rem);
  align-self: stretch;
}

.main-description {
  font-weight: 600;
  width: 100%;
}

.content-container {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.subsection-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-xs, 0.5rem);
  align-self: stretch;
  /* a little extra above each section so they read apart while paragraphs stay tight */
  margin-top: 0.5rem;
}

/* phila-ui typography puts margins on p/ol/li/headings that outrank the global *{margin:0}
   reset (element selectors beat *). Zero them here so the flex gaps above are the ONLY
   vertical spacing — otherwise the typography margins stack on top and leave big white gaps. */
h1,
h2,
p,
ol,
li {
  margin: 0;
}

ol {
  padding-left: 1.5rem;
}
</style>
