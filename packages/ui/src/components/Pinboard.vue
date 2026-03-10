<script setup lang="ts">
import '@phila/phila-ui-core/styles/template-light.css'
import { AppFooter } from '@phila/phila-ui-app-footer'
import { AppHeader } from '@phila/phila-ui-app-header'
import MobileNavPanel from './MobileNavPanel.vue'
import { h, inject, provide, useSlots, type FunctionalComponent } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { PINBOARD_CONFIG_KEY, PINBOARD_SLOTS_KEY } from '../types'

const config = inject(PINBOARD_CONFIG_KEY)!
const slots = useSlots()

provide(PINBOARD_SLOTS_KEY, slots)

const MobileNavContent: FunctionalComponent = () =>
  h(MobileNavPanel, null, {
    default: () => [
      h('h4', null, h(RouterLink, { to: '/' }, () => 'Home')),
      h('h4', null, h(RouterLink, { to: '/finder' }, () => 'Finder')),
    ],
  })
</script>

<template>
  <div class="pinboard">
    <AppHeader
      id="pinboard-nav"
      :show-trusted-site="true"
      :mobile-nav="MobileNavContent"
      :links="[]"
      :navbar-brand="{
        brandingImage: { src: '', href: '/', altText: 'City of Philadelphia' },
        brandingLink: { text: config.title, href: '/' },
      }"
    />

    <main class="pinboard-main">
      <RouterView />
    </main>

    <AppFooter :sub-footer-only="true" />
  </div>
</template>

<style>
.phila-navbar .phila-mobile-nav .nav-flyout {
  flex: 0 0 25rem;
  max-width: 25rem;
  height: calc(100vh - var(--nav-bottom));
}

.phila-navbar .phila-mobile-nav .nav-flyout .p-4 {
  display: flex;
  flex-direction: column;
  row-gap: var(--spacing-m);
}
</style>

<style scoped>
.pinboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.pinboard-main {
  flex: 1;
  overflow: hidden;
}
</style>
