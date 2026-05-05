<script setup lang="ts">
import { PinboardShell } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { useEverbridgeNotifications } from './composables/useEverbridgeNotifications'
import type { AlertBanner } from './types'
import { computed, type ComputedRef } from 'vue'

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
    :logo="{
      variant: 'city',
      layout: 'single-line',
      colorScheme: 'on-primary',
      customName: 'Flood Monitoring Map',
      href: '/',
    }"
    info-title="About this tool"
    :banner-title="alertBanner?.title"
    :banner-message="alertBanner?.body"
  >
    <template #mobile-nav>
      <h4><RouterLink to="/"> Finder </RouterLink></h4>
      <h4><RouterLink to="/resources"> Resources </RouterLink></h4>
    </template>

    <template #info-body>
      <span class="has-text-body-small">
        This map allows residents to keep an eye on water levels in parts of the city and make
        informed decisions prior to, during, and after a flooding event.
        <a href="/resources">Learn more</a>
      </span>
    </template>

    <template #sub-footer>
      <a class="sub-footer-link" href="https://www.phila.gov/">phila.gov</a>
      <a class="sub-footer-link" href="https://www.phila.gov/departments/oem/">OEM</a>
      <a class="sub-footer-link" href="https://www.phila.gov/feedback/">Feedback</a>
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

#app {
  height: 100dvh;
}

.sub-footer-link {
  font-weight: 400;
}
</style>
