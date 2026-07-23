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

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/*
 * Shim for design-token rename: the locally-linked map-core bundles CSS that
 * references --dimension-core-600 (post-revamp name), but the published
 * phila-ui-core consumed by @pinboard/ui only defines --scale-600. Without
 * this shim, .phila-input .content's height collapses to auto and the search
 * bar squishes. Remove once phila-ui-core ships with the renamed token.
 */
:root {
  --dimension-core-600: 3rem;
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

.info-sheet-scrim {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.25);
}

/* Sheet sizes to its content; snap-points value is ignored visually.
 * --drag-y is set inline by the drag handler; transform-only transition
 * springs the sheet back when the user releases under threshold, while
 * keeping height static (animating to auto doesn't work cleanly). */
.info-sheet .bottom-sheet {
  height: auto !important;
  max-height: 90dvh;
  padding: 0 var(--spacing-m) 50px;
  transform: translateY(var(--drag-y, 0px));
  transition: transform 0.25s ease-out !important;
}

.info-sheet.info-sheet--dragging .bottom-sheet {
  transition: none !important;
}

.scrim-fade-leave-active {
  transition: opacity 0.25s ease-out;
  pointer-events: none;
}

.scrim-fade-leave-to {
  opacity: 0;
}

.info-sheet-close {
  position: absolute;
  top: 8px;
  right: 12px;
}

.info-sheet h2 {
  margin-bottom: var(--spacing-s);
}
</style>
