<script setup lang="ts">
import { PinboardShell } from '@pinboard/ui'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const feedbackHref =
  'https://www.phila.gov/departments/department-of-public-health/about-us/contact-us/#send-us-a-message'
</script>

<template>
  <PinboardShell
    :title="t('app.name')"
    :info-title="t('app.aboutTitle')"
    :info-label="t('app.aboutTitle')"
    :info-message="t('callout.message')"
    :info-link-text="t('callout.linkText')"
    info-href="info"
    :translations="true"
    :logo="{
      variant: 'city',
      layout: 'single-line',
      colorScheme: 'on-primary',
      customName: t('app.name'),
      href: '/',
    }"
    :feedback-href="feedbackHref"
    locale-app-key="pcf"
    :show-header-tooltip="false"
  >
    <RouterView />
  </PinboardShell>
</template>
