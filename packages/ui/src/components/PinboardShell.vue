<script setup lang="ts">
import { AppFooter } from '@phila/phila-ui-app-footer'
import { AppHeader } from '@phila/phila-ui-app-header'
import type { NavbarBrand } from '@phila/phila-ui-app-header'
import { FunctionalComponent, h, VNode } from 'vue'
import MobileNavPanel from './MobileNavPanel.vue'

defineProps<{
  title: string
  logo?: NavbarBrand['logo']
  infoTitle?: string
  infoMessage?: string
  bannerTitle?: string
  bannerMessage?: string
}>()

const slots = defineSlots<{
  default(): VNode[]
  'mobile-nav'(): VNode[]
  'info-body'?(): VNode[]
}>()

const MobileNavContent: FunctionalComponent = () =>
  h(MobileNavPanel, null, { default: () => slots['mobile-nav']?.() })
</script>

<template>
  <div class="pinboard">
    <AppHeader
      id="pinboard-nav"
      :show-trusted-site="true"
      :mobile-nav="$slots['mobile-nav'] ? MobileNavContent : undefined"
      :links="[]"
      :navbar-brand="{
        brandingImage: { src: '', href: '/', altText: title },
        brandingLink: logo ? undefined : { text: title, href: '/' },
        logo: logo,
      }"
      :banner-title="bannerTitle"
      :banner-message="bannerMessage"
      :info-title="infoTitle"
      :info-message="infoMessage"
    >
      <template v-if="$slots['info-body']" #info-body>
        <slot name="info-body" />
      </template>
    </AppHeader>

    <main class="pinboard-main">
      <slot />
    </main>

    <AppFooter :sub-footer-only="true" />
  </div>
</template>

<style scoped>
.pinboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
  /* width: min(100vw, 1450px); */
  margin: auto;
}

.pinboard-main {
  position: relative;
  flex: 1;
  overflow: hidden;
}

@media (max-width: 768px) {
  .pinboard > :deep(footer) {
    display: none;
  }
}
</style>
