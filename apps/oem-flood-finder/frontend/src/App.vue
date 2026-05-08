<script setup lang="ts">
import { PinboardShell, NavbarInfo } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { BottomSheet } from '@phila/phila-ui-bottom-sheet'
import { CloseButton } from '@phila/phila-ui-button'
import { useEverbridgeNotifications } from './composables/useEverbridgeNotifications'
import type { AlertBanner } from './types'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
  type ComputedRef,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'

const { everbridgeNotifications } = useEverbridgeNotifications(1)

// if OEM wants to pass in just a title or just a body, we still want to display the alert banner
const alertBanner: ComputedRef<AlertBanner | null> = computed(() => {
  // only displaying LATEST notification if it was created in the last 24 hours
  const oneDayAgo = new Date()
  oneDayAgo.setHours(oneDayAgo.getHours() - 24)

  if (
    everbridgeNotifications.value[0]?.createdOn &&
    new Date(everbridgeNotifications.value[0]?.createdOn) >= oneDayAgo
  ) {
    return {
      title: everbridgeNotifications.value[0]?.title,
      body: everbridgeNotifications.value[0]?.body,
    }
  }
  return null
})

const route = useRoute()
const router = useRouter()
const navbarInfo = useTemplateRef<InstanceType<typeof NavbarInfo>>('navbarInfo')

const isMobile = ref(
  typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches,
)
let mql: MediaQueryList | undefined
function handleMqlChange(e: MediaQueryListEvent) {
  isMobile.value = e.matches
}

const infoSheetOpen = ref(false)

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

watch(isMobile, (mobile) => {
  if (!mobile) infoSheetOpen.value = false
})

onMounted(async () => {
  await router.isReady()
  mql = window.matchMedia('(max-width: 768px)')
  isMobile.value = mql.matches
  mql.addEventListener('change', handleMqlChange)

  if (route.path === '/') {
    if (isMobile.value) {
      infoSheetOpen.value = true
    } else {
      navbarInfo.value?.show()
    }
  }
})

onBeforeUnmount(() => {
  mql?.removeEventListener('change', handleMqlChange)
  document.removeEventListener('pointermove', onSheetPointerMove)
  document.removeEventListener('pointerup', onSheetPointerUp)
  document.removeEventListener('pointercancel', onSheetPointerUp)
})
</script>

<template>
  <PinboardShell
    title="Flood Monitoring Map"
    :logo="{
      variant: 'city',
      layout: 'single-line',
      colorScheme: 'on-primary',
      customName: 'Flood Monitoring Map',
      href: '/',
    }"
    :banner-title="alertBanner?.title"
    :banner-message="alertBanner?.body"
  >
    <template #navbar-end>
      <div v-if="isMobile" class="navbar-info-mobile-wrap" @click.capture.stop="openInfoSheet">
        <NavbarInfo info-title="About this tool" label="About this tool" />
      </div>
      <NavbarInfo v-else ref="navbarInfo" info-title="About this tool" label="About this tool">
        <span class="has-text-body-small">
          This map allows residents to keep an eye on water levels in parts of the city and make
          informed decisions prior to, during, and after a flooding event.
          <a href="/resources">Learn more</a>
        </span>
      </NavbarInfo>
    </template>

    <template #sub-footer>
      <a class="sub-footer-link" href="https://www.phila.gov/terms-of-use/">Terms of use</a>
      <a class="sub-footer-link" href="https://www.phila.gov/open-records-policy/">Right to know</a>
      <a class="sub-footer-link" href="https://www.phila.gov/privacypolicy/">Privacy Policy</a>
      <a class="sub-footer-link" href="https://www.phila.gov/accessibility-policy/"
        >Accessibility</a
      >
      <a class="sub-footer-link" href="mailto:oem@phila.gov">Feedback</a>
    </template>

    <RouterView />
  </PinboardShell>

  <Teleport to="body">
    <Transition name="scrim-fade">
      <div v-if="infoSheetOpen" class="info-sheet-scrim" @click="closeInfoSheet" />
    </Transition>
    <BottomSheet
      v-if="infoSheetOpen"
      v-model="infoSheetOpen"
      class="info-sheet"
      :class="{ 'info-sheet--dragging': isDraggingSheet }"
      :style="{ zIndex: 101, '--drag-y': `${dragY}px` }"
      :snap-points="[60]"
      @pointerdown="onSheetPointerDown"
    >
      <CloseButton class="info-sheet-close" @click="closeInfoSheet" />
      <h2 class="has-text-heading-5">About this tool</h2>
      <span class="has-text-body-small">
        This map allows residents to keep an eye on water levels in parts of the city and make
        informed decisions prior to, during, and after a flooding event.
        <a href="/resources">Learn more</a>
      </span>
    </BottomSheet>
  </Teleport>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/*
 * Shim for design-token rename: the locally-linked map-core bundles CSS that
 * references --dimension-core-600 (post-revamp name), but the published
 * phila-ui-core consumed by @pinboard/ui only defines --scale-600. Without
 * this shim, .phila-input .content's height collapses to auto and the search
 * bar squishes. Remove once phila-ui-core ships with the renamed token.
 */
:root {
  --dimension-core-600: 3rem;
}

#app {
  height: 100dvh;
}

.sub-footer-link {
  font-weight: 400;
}

.phila-navbar-brand {
  padding-left: var(--spacing-l);
}

.info-sheet-scrim {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.25);
}

/* Sheet sizes to its content; snap-points value is ignored visually.
 * --drag-y is set inline by the drag handler; transform-only transition
 * springs the sheet back when the user releases under threshold, while
 * keeping height static (animating to auto doesn't work cleanly). */
.info-sheet .bottom-sheet {
  height: auto !important;
  max-height: 90dvh;
  padding: 0 var(--spacing-m) 50px;
  transform: translateY(var(--drag-y, 0px));
  transition: transform 0.25s ease-out !important;
}

.info-sheet.info-sheet--dragging .bottom-sheet {
  transition: none !important;
}

.scrim-fade-leave-active {
  transition: opacity 0.5s ease-out;
  pointer-events: none;
}

.scrim-fade-leave-to {
  opacity: 0;
}

.info-sheet-close {
  position: absolute;
  top: 8px;
  right: 12px;
}

.info-sheet h2 {
  margin-bottom: var(--spacing-s);
}
</style>
