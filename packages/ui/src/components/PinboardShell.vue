<script setup lang="ts">
import { AppFooter } from '@phila/phila-ui-app-footer'
import { AppHeader } from '@phila/phila-ui-app-header'
import MobileNavPanel from './MobileNavPanel.vue'
import type { VNode } from 'vue'
import type { NavbarBrand } from '@phila/phila-ui-app-header'

defineProps<{
  title: string
  logo?: NavbarBrand['logo']
  bannerTitle?: string
  bannerMessage?: string
}>()

defineSlots<{
  default(): VNode[]
  'mobile-nav'(): VNode[]
  'navbar-end'?(): VNode[]
  'sub-footer'?(): VNode[]
}>()
</script>

<template>
  <div class="pinboard">
    <AppHeader
      id="pinboard-nav"
      :show-trusted-site="true"
      :links="[]"
      :navbar-brand="{
        brandingImage: { src: '', href: '/', altText: title },
        brandingLink: logo ? undefined : { text: title, href: '/' },
        logo: logo,
      }"
      :banner-title="bannerTitle"
      :banner-message="bannerMessage"
    >
      <template v-if="$slots['mobile-nav']" #mobile-nav>
        <MobileNavPanel>
          <slot name="mobile-nav" />
        </MobileNavPanel>
      </template>
      <template v-if="$slots['navbar-end']" #navbar-end>
        <slot name="navbar-end" />
      </template>
    </AppHeader>

    <main class="pinboard-main">
      <slot />
    </main>

    <AppFooter :sub-footer-only="true">
      <template v-if="$slots['sub-footer']" #subFooterSlot>
        <slot name="sub-footer" />
      </template>
    </AppFooter>
  </div>
</template>

<style scoped>
.pinboard {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  /* width: min(100vw, 1450px); */
  margin: auto;
}

.pinboard-main {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.pinboard :deep(.phila-navbar) {
  column-gap: var(--spacing-s);
}

.phila-navbar .phila-mobile-nav .nav-flyout {
  flex: 0 0 25rem;
  max-width: 25rem;
  height: calc(100dvh - var(--nav-bottom));
}

.phila-navbar .phila-mobile-nav .nav-flyout .p-4 {
  display: flex;
  flex-direction: column;
  row-gap: var(--spacing-m);
}

@media (max-width: 768px), (max-width: 1064px) and (max-height: 600px) {
  .pinboard > :deep(footer) {
    display: none;
  }

  .pinboard :deep(#trusted-site) {
    height: 2rem !important;
  }

  .pinboard :deep(.phila-navbar-logo.logo--single-line) {
    font-size: 1.3rem;
    white-space: nowrap;
  }

  .pinboard :deep(.phila-navbar-brand-link) {
    margin-left: var(--spacing-s) !important;
  }
}
</style>
