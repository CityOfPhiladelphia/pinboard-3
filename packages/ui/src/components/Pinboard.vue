<script setup lang="ts">
import '@phila/phila-ui-core/styles/template-light.css'
import { AppFooter } from '@phila/phila-ui-app-footer'
import { AppHeader } from '@phila/phila-ui-app-header'
import MobileNavPanel from './MobileNavPanel.vue'
import { h, type FunctionalComponent, type VNode } from 'vue'

defineProps<{
  title: string
}>()

const slots = defineSlots<{
  default(): VNode[]
  'mobile-nav'(): VNode[]
}>()

const MobileNavContent: FunctionalComponent = () =>
  h(MobileNavPanel, null, { default: () => slots['mobile-nav']?.() })
</script>

<template>
  <div class="pinboard">
    <AppHeader
      id="pinboard-nav"
      :show-trusted-site="false"
      :mobile-nav="$slots['mobile-nav'] ? MobileNavContent : undefined"
      :links="[]"
      :navbar-brand="{
        brandingImage: { src: '', href: '/', altText: 'City of Philadelphia' },
        brandingLink: { text: title, href: '/' },
      }"
    />

    <main class="pinboard-main">
      <slot />
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
