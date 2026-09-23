<script setup lang="ts">
import { AppFooter } from '@phila/phila-ui-app-footer'
import { AppHeader, NavbarInfo, NavbarLinks } from '@phila/phila-ui-app-header'
import { BottomSheet } from '@phila/phila-ui-bottom-sheet'
import { CloseButton } from '@phila/phila-ui-button'
import { Callout } from '@phila/phila-ui-callout'
import { useVisibility } from '@phila/phila-ui-core'
import MobileNavPanel from './MobileNavPanel.vue'
import PinboardSubFooter from './PinboardSubFooter.vue'
import { computed, onMounted, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { VNode } from 'vue'
import type { NavbarBrandProps, NavLink } from '@phila/phila-ui-app-header'
import { useInitPinboardApp } from '../composables/_index.ts'
import { languages } from '../i18n/languages.ts'

const props = defineProps<{
  title: string
  logo?: NavbarBrandProps['logo']
  translations: boolean
  bannerTitle?: string
  bannerMessage?: string
  feedbackHref?: string
  infoTitle?: string
  infoLabel?: string
  infoMessage?: string
  infoLinkText?: string
  infoHref?: string
  localeAppKey?: string
  showHeaderTooltip: boolean
  links?: NavLink[]
}>()

defineSlots<{
  default(): VNode[]
  'mobile-nav'(): VNode[]
  'navbar-end'(): VNode[]
  'info-body'(): VNode[]
  'sub-footer'(): VNode[]
}>()

const navbarBrandProps = computed(() => ({
  brandingImage: { src: '', href: '/', altText: props.title },
  brandingLink: props.logo ? undefined : { text: props.title, href: '/' },
  logo: props.logo,
}))

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

const HEADER_ID = 'pinboard-nav'
const MOBILE_NAV_ID = `mobile-nav-${HEADER_ID}`
const { setState: setMobileNavVisibility } = useVisibility({
  id: MOBILE_NAV_ID,
  group: HEADER_ID,
})

function closeMobileNav() {
  setMobileNavVisibility(MOBILE_NAV_ID, false)
}

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
    // Matches the #navbar-end info-icon's own gate below: without a
    // tooltip or an info page to link to, the sheet has nothing to show —
    // opening it anyway (as this used to, unconditionally) is just an empty
    // bottom sheet with a close button.
    infoSheetOpen.value = isMobile.value && (props.showHeaderTooltip || !!props.infoHref)
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
    <!-- showSearch is left unset: AppHeader shows the search button only when
         the search-panel slot actually has content, which we never provide.
         showNavbarToggle needs to be explicit, though: its own doc comment
         says it defaults to "show only if the mobile-nav slot has content",
         via `showNavbarToggle ?? !!$slots['mobile-nav']` internally, but an
         omitted Boolean prop is cast to false by Vue, not undefined — so
         that `??` never falls through and the burger never auto-shows (same
         gotcha ReportDetail.vue's showUpvote default works around). Passed
         explicitly here instead of relying on that. -->
    <AppHeader
      :id="HEADER_ID"
      :compact-mobile="true"
      :show-trusted-site="true"
      :show-navbar-toggle="!!$slots['mobile-nav'] || !!links?.length"
      :navbar-brand="navbarBrandProps"
      :links="links"
      :languages="translations ? languages : undefined"
      :locale="locale"
      @update:locale="setLocale"
    >
      <template v-if="$slots['mobile-nav'] || links?.length" #mobile-nav>
        <MobileNavPanel v-if="$slots['mobile-nav']" @click="closeMobileNav">
          <slot name="mobile-nav" />
        </MobileNavPanel>
        <MobileNavPanel v-else @click="closeMobileNav">
          <NavbarLinks :links="links" />
        </MobileNavPanel>
      </template>

      <!-- AppHeader's site-wide alert moved from a single-banner prop pair to an #alerts
           slot that accepts any number of Callouts. PinboardShell still exposes the old
           bannerTitle/bannerMessage prop pair to its own consumers (unchanged external API)
           and adapts internally by wrapping them in one Callout. -->
      <template v-if="bannerTitle || bannerMessage" #alerts>
        <Callout type="warning" :title="bannerTitle" :message="bannerMessage" :open="true" />
      </template>

      <template v-if="$slots['navbar-end']" #navbar-end>
        <slot name="navbar-end" />
      </template>
      <!-- Nothing configured (no tooltip, no info page to link to) -> render
           nothing, rather than the RouterLink fallback below with an
           undefined infoHref (`/${infoHref}` -> "/undefined"). -->
      <template v-else-if="showHeaderTooltip || infoHref" #navbar-end>
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

.pinboard-shell-info-scrim {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.25);
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
  transition: transform 0.25s ease-out !important;
}

.pinboard-shell-info-sheet.pinboard-shell-info-sheet--dragging .bottom-sheet {
  transition: none !important;
}

.pinboard-shell-scrim-fade-leave-active {
  transition: opacity 0.25s ease-out;
  pointer-events: none;
}

.pinboard-shell-scrim-fade-leave-to {
  opacity: 0;
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

/*Temp mobile nav styles */

@media screen and (min-width: 1025px) {
  .pinboard :deep(.phila-navbar-burger) {
    display: none !important;
  }
}

.pinboard :deep(.phila-mobile-nav .phila-navbar-item.phila-navbar-list) {
  display: flex !important;
  flex-direction: column;
  align-items: stretch;
  gap: var(--spacing-2xs, 0.25rem);
}

.pinboard :deep(.phila-mobile-nav .phila-navbar-link) {
  color: var(--Schemes-On-Surface, #343434);
}
.pinboard :deep(.phila-mobile-nav .phila-navbar-link:hover),
.pinboard :deep(.phila-mobile-nav .phila-navbar-link:active),
.pinboard :deep(.phila-mobile-nav .phila-navbar-link.phila-navbar-item-flyout-active) {
  color: var(--Schemes-On-Surface, #343434);
  background-color: var(--sidewalk-grey-700-sidewalk-grey, #f1f1f1);
}
.pinboard :deep(.phila-mobile-nav .phila-navbar-link.phila-navbar-link-text:hover),
.pinboard :deep(.phila-mobile-nav .phila-navbar-link.phila-navbar-link-text:focus),
.pinboard :deep(.phila-mobile-nav .phila-navbar-link.phila-navbar-link-text:active) {
  color: var(--Schemes-On-Surface, #343434);
  background-color: transparent;
}
</style>
