<script setup lang="ts">
import { PinboardShell } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { NavbarInfo } from '@pinboard/ui'
import { useEverbridgeNotifications } from './composables/useEverbridgeNotifications'
import type { AlertBanner } from './types'
import { computed, onMounted, useTemplateRef, type ComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

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

const route = useRoute()
const router = useRouter()
const navbarInfo = useTemplateRef<InstanceType<typeof NavbarInfo>>('navbarInfo')
onMounted(async () => {
  await router.isReady()
  if (route.path === '/') navbarInfo.value?.show()
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
    :banner-title="alertBanner?.title"
    :banner-message="alertBanner?.body"
  >
    <template #navbar-end>
      <NavbarInfo ref="navbarInfo" info-title="About this tool" label="About this tool">
        <span class="has-text-body-small">
          This map allows residents to keep an eye on water levels in parts of the city and make
          informed decisions prior to, during, and after a flooding event.
          <a href="/resources">Learn more</a>
        </span>
      </NavbarInfo>
    </template>

    <template #sub-footer>
      <a class="sub-footer-link" href="https://www.phila.gov/terms-of-use/">Terms of use</a>
      <a class="sub-footer-link" href="https://www.phila.gov/open-records-policy/">Right to know</a>
      <a class="sub-footer-link" href="https://www.phila.gov/privacypolicy/">Privacy Policy</a>
      <a class="sub-footer-link" href="https://www.phila.gov/accessibility-policy/"
        >Accessibility</a
      >
      <a class="sub-footer-link" href="mailto:oem@phila.gov">Feedback</a>
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

.phila-navbar-brand {
  padding-left: var(--spacing-l);
}
</style>
