<script setup lang="ts">
import { AppFooter } from '@phila/phila-ui-app-footer'
import { AppHeader, NavbarInfo } from '@phila/phila-ui-app-header'
import { BottomSheet } from '@phila/phila-ui-bottom-sheet'
import { CloseButton } from '@phila/phila-ui-button'
import { Icon } from '@phila/phila-ui-core'
import { IconCircleInfo } from '@phila/phila-ui-core/icons'
import MobileNavPanel from './MobileNavPanel.vue'
import PinboardSubFooter from './PinboardSubFooter.vue'
import { inject, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { VNode } from 'vue'
import type { NavbarBrandProps, Language } from '@phila/phila-ui-app-header'
import { IS_MOBILE_KEY } from '../keys.ts'

defineProps<{
  title: string
  logo?: NavbarBrandProps['logo']
  bannerTitle?: string
  bannerMessage?: string
  languages?: Language[]
  locale?: string
  feedbackHref?: string
  infoTitle?: string
  infoLabel?: string
  infoHref?: string
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

const isMobile = inject(IS_MOBILE_KEY, ref(false))
const infoSheetOpen = ref(false)
const navbarInfoRef = ref<{ hide: () => void } | null>(null)
const route = useRoute()

watch(
  () => route.fullPath,
  () => {
    navbarInfoRef.value?.hide()
    infoSheetOpen.value = false
  }
)

/* Capture-phase click on the wrapper runs before the inner Tooltip's
 * bubble-phase listener, so stopPropagation suppresses the tooltip and
 * we open the bottom sheet instead. */
function openInfoSheet(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  infoSheetOpen.value = true
}

function closeInfoSheet() {
  infoSheetOpen.value = false
  dragY.value = 0
}

/* Drag-down-to-dismiss. BottomSheet's built-in drag is snap-point based
 * and a single snap point ([60]) clamps it to no movement, so we layer
 * our own pointer tracking on top: translate the sheet to follow the
 * pointer, dismiss past DRAG_DISMISS_THRESHOLD on release, otherwise
 * spring back. Clicks (zero delta) pass through. */
const DRAG_DISMISS_THRESHOLD = 160
const dragY = ref(0)
const isDraggingSheet = ref(false)
let dragStartY = 0

function onSheetPointerDown(e: PointerEvent) {
  dragStartY = e.clientY
  dragY.value = 0
  isDraggingSheet.value = true
  document.addEventListener('pointermove', onSheetPointerMove)
  document.addEventListener('pointerup', onSheetPointerUp)
  document.addEventListener('pointercancel', onSheetPointerUp)
}

function onSheetPointerMove(e: PointerEvent) {
  if (!isDraggingSheet.value) return
  dragY.value = Math.max(0, e.clientY - dragStartY)
}

function onSheetPointerUp() {
  if (!isDraggingSheet.value) return
  isDraggingSheet.value = false
  document.removeEventListener('pointermove', onSheetPointerMove)
  document.removeEventListener('pointerup', onSheetPointerUp)
  document.removeEventListener('pointercancel', onSheetPointerUp)
  if (dragY.value > DRAG_DISMISS_THRESHOLD) {
    closeInfoSheet()
  } else {
    dragY.value = 0
  }
}
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
      <template #navbar-search>
        <span hidden />
      </template>

      <!-- Only show the hamburger when the app provides a mobile nav. AppHeader renders
           the burger by default; suppress it otherwise so apps without a mobile nav (e.g.
           oem-flood-finder) don't get a stray hamburger. Restores the pre-slot-refactor
           "burger only if mobile-nav" behavior; same root cause as bead map-core-k8c.
           Hidden span (not empty) because Vue renders a slot's default content when the
           overriding slot is empty. -->
      <template v-if="!$slots['mobile-nav']" #navbar-toggle>
        <span hidden />
      </template>

      <template v-if="$slots['mobile-nav']" #mobile-nav>
        <MobileNavPanel>
          <slot name="mobile-nav" />
        </MobileNavPanel>
      </template>
      <template v-if="infoHref || infoTitle || $slots['navbar-end']" #navbar-end>
        <RouterLink v-if="infoHref" :to="infoHref" class="navbar-info-link">
          <Icon
            :icon="IconCircleInfo"
            decorative
            inline
            size="small"
            class="navbar-info-link__icon"
          />
          <span
            v-if="infoLabel ?? infoTitle"
            class="navbar-info-link__label has-text-body-default hidden-tablet"
            >{{ infoLabel ?? infoTitle }}</span
          >
        </RouterLink>
        <template v-else-if="infoTitle">
          <div v-if="isMobile" class="navbar-info-mobile-wrap" @click.capture.stop="openInfoSheet">
            <NavbarInfo :info-title="infoTitle" :label="infoLabel ?? infoTitle" />
          </div>
          <NavbarInfo
            v-else
            ref="navbarInfoRef"
            :info-title="infoTitle"
            :label="infoLabel ?? infoTitle"
          >
            <slot name="info-body" />
          </NavbarInfo>
        </template>
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

  <Teleport to="body">
    <Transition name="pinboard-shell-scrim-fade">
      <div v-if="infoSheetOpen" class="pinboard-shell-info-scrim" @click="closeInfoSheet" />
    </Transition>
    <BottomSheet
      v-if="infoSheetOpen"
      v-model="infoSheetOpen"
      class="pinboard-shell-info-sheet"
      :class="{ 'pinboard-shell-info-sheet--dragging': isDraggingSheet }"
      :style="{ zIndex: 101, '--drag-y': `${dragY}px` }"
      :snap-points="[60]"
      @pointerdown="onSheetPointerDown"
    >
      <CloseButton class="pinboard-shell-info-close" @click="closeInfoSheet" />
      <h2 class="has-text-heading-5">{{ infoTitle }}</h2>
      <slot name="info-body" />
    </BottomSheet>
  </Teleport>
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

.pinboard :deep(.phila-navbar) {
  column-gap: var(--spacing-s);
}

.navbar-info-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  text-decoration: none;
}

.navbar-info-link__icon {
  color: white;
}

.navbar-info-link__label {
  color: var(--Extended-Colors-link-default);
  text-decoration: underline;
  font-weight: normal;
}

.navbar-info-link:hover .navbar-info-link__label {
  color: var(--Extended-Colors-link-hover);
  text-decoration-color: var(--Extended-Colors-link-hover);
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

<style>
/* Teleported elements (scrim + bottom-sheet) live outside this component's
 * DOM scope, so scoped selectors won't reach them. Unscoped block required. */
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
.pinboard-shell-info-sheet .bottom-sheet {
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
</style>
