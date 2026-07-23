<script setup lang="ts">
import { PinboardShell } from '@pinboard/ui'
import { useEverbridgeNotifications } from './composables/useEverbridgeNotifications'
import type { AlertBanner } from './types'
import { computed, type ComputedRef } from 'vue'

const feedbackHref = 'https://phila.formstack.com/forms/oem_flood_monitoring_map_feedback'

const { everbridgeNotifications } = useEverbridgeNotifications(1)

// if OEM wants to pass in just a title or just a body, we still want to display the alert banner
const alertBanner: ComputedRef<AlertBanner | null> = computed(() => {
  // only displaying LATEST notification if it was created in the last 24 hours
  const oneDayAgo = new Date()
  oneDayAgo.setHours(oneDayAgo.getHours() - 24)

  if (
    everbridgeNotifications.value[0]?.createdOn &&
    new Date(everbridgeNotifications.value[0]?.createdOn) >= oneDayAgo
  ) {
    return {
      title: everbridgeNotifications.value[0]?.title,
      body: everbridgeNotifications.value[0]?.body,
    }
  }
  return null
})
</script>

<template>
  <PinboardShell
    title="Flood Monitoring Map"
    info-title="About this tool"
    info-message="This map allows residents to keep an eye on water levels in parts of the city and make informed decisions prior to, during, and after a flooding event."
    info-link-text="Learn more"
    info-href="resources"
    :translations="false"
    :logo="{
      variant: 'city',
      layout: 'single-line',
      colorScheme: 'on-primary',
      customName: 'Flood Monitoring Map',
      href: '/',
    }"
    :banner-title="alertBanner?.title"
    :banner-message="alertBanner?.body"
    :feedback-href="feedbackHref"
    :show-header-tooltip="true"
  >
    <RouterView />
  </PinboardShell>
</template>
