<script setup lang="ts">
import { PhilaButton } from '@phila/phila-ui-button'

const props = defineProps<{
  activateFinder: () => void
}>()
</script>

<template>
  <div class="home-content">
    <section class="intro">
      <h2>{{ $t('introPage.section1Title') }}</h2>
      <p v-html="$t('introPage.p0')" />

      <div class="intro-actions">
        <PhilaButton :text="$t('app.viewList')" @click="activateFinder" />
      </div>

      <p v-html="$t('introPage.p05')" />
      <p v-html="$t('introPage.p1')" />
      <ol>
        <li>{{ $t('introPage.ol1.li1') }}</li>
        <li>{{ $t('introPage.ol1.li2') }}</li>
        <li>{{ $t('introPage.ol1.li3') }}</li>
      </ol>
    </section>

    <section>
      <h2>{{ $t('introPage.section2Title') }}</h2>
      <p v-html="$t('introPage.p2')" />
    </section>

    <section>
      <h2>{{ $t('introPage.section25Title') }}</h2>
      <p v-html="$t('introPage.p25')" />
    </section>

    <section>
      <h2>{{ $t('introPage.section3Title') }}</h2>
      <p>{{ $t('introPage.p3') }}</p>
    </section>

    <section>
      <h2>{{ $t('introPage.section4Title') }}</h2>
      <p>{{ $t('introPage.p4') }}</p>
    </section>

    <section>
      <h2>{{ $t('introPage.section5Title') }}</h2>
      <p>
        {{ $t('introPage.p5') }}
        <a target="_blank" href="https://www.phila.gov/departments/department-of-public-health/about-us/contact-us/#send-us-a-message">
          {{ $t('introPage.feedbackForm') }}
        </a>.
      </p>
    </section>
  </div>
</template>

<style scoped>
.home-content {
  max-width: 50rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.intro-actions {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}
</style>
