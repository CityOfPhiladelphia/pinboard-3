<!-- ABOUTME: Root component. Wraps every route in PinboardShell chrome inside a
     phila .content region and surfaces the Answers entry in the navbar. -->
<script setup lang="ts">
import { PinboardShell } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import '@/assets/a11y.css'
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
    <template #navbar-end>
      <RouterLink class="navbar-answers" to="/answers">Answers</RouterLink>
    </template>
    <div class="content app-content">
      <RouterView />
    </div>
  </PinboardShell>
</template>

<style scoped>
/* Pass-through wrapper: applies phila .content typography to routed pages
   without introducing a layout box that would break the full-height map. */
.app-content {
  display: contents;
}

.navbar-answers {
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  padding: 0 var(--spacing-s, 0.75rem);
}
.navbar-answers:hover {
  text-decoration: underline;
}
</style>
