<!-- ABOUTME: Root component. Wraps every route in PinboardShell chrome.
     Increment-1 skeleton — landing content arrives in Increment 2. -->
<script setup lang="ts">
import { PinboardShell } from '@pinboard/ui'
import '@pinboard/ui/style.css'
</script>

<template>
  <PinboardShell
    title="Philly 311"
    :logo="{
      variant: 'city',
      layout: 'single-line',
      colorScheme: 'on-primary',
      customName: 'Philly 311',
      href: '/',
    }"
  >
    <RouterView />
  </PinboardShell>
</template>
