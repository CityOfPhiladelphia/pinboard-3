<script setup lang="ts">
import { AppFooter } from '@phila/phila-ui-app-footer'
import { AppHeader, NavbarInfo } from '@phila/phila-ui-app-header'
import { BottomSheet } from '@phila/phila-ui-bottom-sheet'
import { CloseButton } from '@phila/phila-ui-button'
import MobileNavPanel from './MobileNavPanel.vue'
import PinboardSubFooter from './PinboardSubFooter.vue'
import { onMounted, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { VNode } from 'vue'
import type { NavbarBrandProps } from '@phila/phila-ui-app-header'
import { useInitPinboardApp } from '../composables/_index.ts'
import { languages } from '../i18n/languages.ts'

const props = defineProps<{
  title: string
  logo?: NavbarBrandProps['logo']
  translations: boolean
  bannerTitle?: string
  bannerMessage?: string
  feedbackHref?: string
  infoTitle: string
  infoLabel?: string
  infoMessage: string
  infoLinkText: string
  infoHref: string
  localeAppKey?: string
  showHeaderTooltip: boolean
}>()

defineSlots<{
  default(): VNode[]
  'mobile-nav'(): VNode[]
  'navbar-end'(): VNode[]
  'info-body'(): VNode[]
  'sub-footer'(): VNode[]
}>()

const {
  isMobile,
  infoSheetOpen,
  dragY,
  openInfoSheet,
  closeInfoSheet,
  onSheetPointerDown,
  locale,
  setLocale,
} = useInitPinboardApp(props.localeAppKey)

const navbarInfo = useTemplateRef<InstanceType<typeof NavbarInfo>>('navbarInfo')
const router = useRouter()
const route = useRoute()

watch(
  () => route.fullPath,
  () => {
    navbarInfo.value?.hide()
    infoSheetOpen.value = false
  }
)

watch(isMobile, (newVal) => {
  if (newVal) {
    navbarInfo.value?.hide()
  } else {
    infoSheetOpen.value = false
  }
})

onMounted(async () => {
  await router.isReady()
  if (route.path === '/') {
    infoSheetOpen.value = isMobile.value
    if (isMobile.value || !props.showHeaderTooltip) {
      navbarInfo.value?.hide()
    } else {
      navbarInfo.value?.show()
    }
  }
})
</script>

<template>
  <div class="pinboard">
    <AppHeader
      id="pinboard-nav"
      :compact-mobile="true"
      :show-trusted-site="true"
      :navbar-brand="{
        brandingImage: { src: '', href: '/', altText: title },
        brandingLink: logo ? undefined : { text: title, href: '/' },
        logo: logo,
      }"
      :banner-title="bannerTitle"
      :banner-message="bannerMessage"
      :languages="translations ? languages : undefined"
      :locale="locale"
      @update:locale="setLocale"
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
      <template v-else #mobile-nav>
        <MobileNavPanel>
          <slot name="mobile-nav" />
        </MobileNavPanel>
      </template>

      <template v-if="$slots['navbar-end']" #navbar-end>
        <slot name="navbar-end" />
      </template>
      <template v-else #navbar-end>
        <NavbarInfo
          v-if="showHeaderTooltip"
          v-bind="isMobile ? { onClickCapture: openInfoSheet } : {}"
          ref="navbarInfo"
          :info-title="infoTitle"
          :label="infoLabel ?? infoTitle"
        >
          <span v-if="!isMobile" class="has-text-body-small">
            {{ infoMessage }}
            <RouterLink :to="`/${infoHref}`">{{ infoLinkText }}</RouterLink>
          </span>
        </NavbarInfo>
        <RouterLink v-else :to="`/${infoHref}`">
          <NavbarInfo
          :info-title="infoTitle"
          :label="infoLabel ?? infoTitle"
          :style="{ pointerEvents: showHeaderTooltip ? 'auto' : 'none' }"
        />
        </RouterLink>
      </template>
    </AppHeader>

    <main class="pinboard-main">
      <slot />
    </main>

    <AppFooter v-if="!isMobile" :sub-footer-only="true">
      <template #subFooterSlot>
        <slot name="sub-footer">
          <PinboardSubFooter :feedback-href="feedbackHref" />
        </slot>
      </template>
    </AppFooter>
  </div>

  <div v-if="isMobile">
    <Transition name="pinboard-shell-scrim-fade">
      <div v-if="infoSheetOpen" class="pinboard-shell-info-scrim" @click="closeInfoSheet" />
    </Transition>
    <BottomSheet
      v-if="infoSheetOpen"
      v-model="infoSheetOpen"
      class="pinboard-shell-info-sheet"
      :style="{ zIndex: 101, '--drag-y': `${dragY}px` }"
      :snap-points="[60]"
      @pointerdown="onSheetPointerDown"
    >
      <CloseButton class="pinboard-shell-info-close" @click="closeInfoSheet" />
      <h2 class="has-text-heading-5">{{ infoTitle }}</h2>
      <span class="has-text-body-small">
        {{ infoMessage }}
        <RouterLink :to="`/${infoHref}`" @click="closeInfoSheet">{{ infoLinkText }}</RouterLink>
      </span>
    </BottomSheet>
  </div>
</template>

<style scoped>
.pinboard {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  margin: auto;
}

.pinboard-main {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.pinboard :deep(.phila-navbar-brand) {
  padding-left: var(--spacing-l);
}

/* Sheet sizes to its content; snap-points value is ignored visually.
 * --drag-y is set inline by the drag handler; transform-only transition
 * springs the sheet back when the user releases under threshold, while
 * keeping height static (animating to auto doesn't work cleanly).
 * NOTE: `.bottom-sheet` is @phila/phila-ui-bottom-sheet's internal class — a
 * deliberate coupling; revisit if that package renames it. */
.pinboard-shell-info-sheet :deep(.bottom-sheet) {
  height: auto !important;
  max-height: 90dvh;
  padding: 0 var(--spacing-m) 50px;
  transform: translateY(var(--drag-y, 0px));
  transition: transform 0.25s ease-out;
}

.pinboard-shell-info-scrim {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.25);
}

.pinboard-shell-info-close {
  position: absolute;
  top: 8px;
  right: 12px;
}

.pinboard-shell-info-sheet h2 {
  margin-bottom: var(--spacing-s);
}

@media (max-width: 768px), (max-width: 1064px) and (max-height: 600px) {
  .pinboard :deep(#trusted-site) {
    height: 2rem;
  }

  .pinboard :deep(.phila-navbar-logo.logo--single-line) {
    font-size: 1rem;
    white-space: nowrap;
  }

  .pinboard :deep(.phila-navbar-brand-link) {
    margin-left: var(--spacing-s);
  }
}
</style>
