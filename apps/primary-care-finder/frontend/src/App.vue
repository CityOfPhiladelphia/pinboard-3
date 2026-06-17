<script setup lang="ts">
import { PinboardShell, languages } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { useI18n } from 'vue-i18n'
import { useLocale } from './composables/useLocale'

const { t } = useI18n()
const { locale, init, setLocale } = useLocale()
init()

const feedbackHref =
  'https://www.phila.gov/departments/department-of-public-health/about-us/contact-us/#send-us-a-message'
</script>

<template>
  <PinboardShell
    :title="t('app.name')"
    :logo="{
      variant: 'city',
      layout: 'single-line',
      colorScheme: 'on-primary',
      customName: t('app.name'),
      href: '/',
    }"
    :info-title="t('app.aboutTitle')"
    :languages="languages"
    :locale="locale"
    :feedback-href="feedbackHref"
    @update:locale="setLocale"
  >
    <template #info-body>
      <span class="has-text-body-small">{{ t('app.aboutBody') }}</span>
    </template>

    <RouterView />
  </PinboardShell>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.phila-navbar-brand {
  padding-left: var(--spacing-l);
}
</style>
