<script setup lang="ts">
import { AppFooter } from '@phila/phila-ui-app-footer'
import { AppHeader, NavbarInfo } from '@phila/phila-ui-app-header'
import MobileNavPanel from './MobileNavPanel.vue'
import PinboardSubFooter from './PinboardSubFooter.vue'
import type { VNode } from 'vue'
import type { NavbarBrandProps, Language } from '@phila/phila-ui-app-header'

defineProps<{
  title: string
  logo?: NavbarBrandProps['logo']
  bannerTitle?: string
  bannerMessage?: string
  languages?: Language[]
  locale?: string
  feedbackHref?: string
  infoTitle?: string
}>()

const emit = defineEmits<{
  'update:locale': [code: string]
}>()

defineSlots<{
  default(): VNode[]
  'mobile-nav'(): VNode[]
  'navbar-end'?(): VNode[]
  'info-body'?(): VNode[]
  'sub-footer'?(): VNode[]
}>()
</script>

<template>
  <div class="pinboard">
    <AppHeader
      id="pinboard-nav"
      :compact-mobile="true"
      :show-trusted-site="true"
      :links="[]"
      :navbar-brand="{
        brandingImage: { src: '', href: '/', altText: title },
        brandingLink: logo ? undefined : { text: title, href: '/' },
        logo: logo,
      }"
      :banner-title="bannerTitle"
      :banner-message="bannerMessage"
      :languages="languages"
      :locale="locale"
      @update:locale="emit('update:locale', $event)"
    >
      <!-- Suppress AppHeader's default search button: it renders by default but opens an
           empty panel since we don't wire up search. Temporary until the upstream fix
           (phila-ui-4 bead map-core-k8c) gates the default on a search-panel slot.
           Must contain a real (non-comment) node: Vue renders the slot's default content
           when an overriding slot is empty, so a hidden span is what actually suppresses it. -->
      <template #navbar-search><span hidden /></template>

      <!-- Only show the hamburger when the app provides a mobile nav. AppHeader renders
           the burger by default; suppress it otherwise so apps without a mobile nav (e.g.
           oem-flood-finder) don't get a stray hamburger. Restores the pre-slot-refactor
           "burger only if mobile-nav" behavior; same root cause as bead map-core-k8c.
           Hidden span (not empty) because Vue renders a slot's default content when the
           overriding slot is empty. -->
      <template v-if="!$slots['mobile-nav']" #navbar-toggle><span hidden /></template>

      <template v-if="$slots['mobile-nav']" #mobile-nav>
        <MobileNavPanel>
          <slot name="mobile-nav" />
        </MobileNavPanel>
      </template>
      <template v-if="infoTitle || $slots['navbar-end']" #navbar-end>
        <NavbarInfo v-if="infoTitle" :info-title="infoTitle" :label="infoTitle">
          <slot name="info-body" />
        </NavbarInfo>
        <slot name="navbar-end" />
      </template>
    </AppHeader>

    <main class="pinboard-main">
      <slot />
    </main>

    <AppFooter :sub-footer-only="true">
      <template #subFooterSlot>
        <slot name="sub-footer">
          <PinboardSubFooter :feedback-href="feedbackHref" />
        </slot>
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
    font-size: 1rem;
    white-space: nowrap;
  }

  .pinboard :deep(.phila-navbar-brand-link) {
    margin-left: var(--spacing-s) !important;
  }
}
</style>
