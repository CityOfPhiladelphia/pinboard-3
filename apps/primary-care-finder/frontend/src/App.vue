<script setup lang="ts">
import { PinboardShell, PinboardComposables, languages } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { BottomSheet } from '@phila/phila-ui-bottom-sheet'
import { CloseButton } from '@phila/phila-ui-button'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocale } from './composables/useLocale'

const { t } = useI18n()
const { locale, init, setLocale } = useLocale()
init()

const feedbackHref =
  'https://www.phila.gov/departments/department-of-public-health/about-us/contact-us/#send-us-a-message'

const infoSheetOpen = ref(false)

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

const isMobile = PinboardComposables.useIsMobile()

watch(isMobile, (mobile) => {
  if (!mobile) infoSheetOpen.value = false
})

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  await router.isReady()

  if (route.path === '/' && isMobile.value) {
    infoSheetOpen.value = true
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointermove', onSheetPointerMove)
  document.removeEventListener('pointerup', onSheetPointerUp)
  document.removeEventListener('pointercancel', onSheetPointerUp)
})
</script>

<template>
  <PinboardShell
    :title="t('app.name')"
    :logo="{
      variant: 'city',
      layout: 'single-line',
      colorScheme: 'on-primary',
      customName: t('app.name'),
      href: '/',
    }"
    :info-label="t('app.aboutTitle')"
    info-href="/info"
    :languages="languages"
    :locale="locale"
    :feedback-href="feedbackHref"
    @update:locale="setLocale"
  >
<<<<<<< HEAD
    <RouterView />
=======
    <template #info-body>
      <span class="has-text-body-small">
        This tool helps Philadelphia residents find free and low-cost primary care providers near
        them. Search by location, filter by services, and view details like hours, transit options,
        and available tests.
      </span>
    </template>

    <PinboardBody
      v-model:filter-values="filterValues"
      :locations="filteredLocations"
      :search-or-user-location="userLocation"
      :is-loading="isLoading"
      :error-message="errorMessage"
      :location-panel-search="searchPlaceholderText"
      :geojson="geojson"
      :is-mobile="isMobile"
      :filters="filterDefinitions"
      @search="handleSearchSubmit"
    >
      <template #location-card="{ location }">
        <LocationCard :location="location" />
      </template>

      <template #location-detail="{ location, onClose }">
        <LocationDetail :location="asPrimaryCareLocation(location)" :on-close="onClose" />
      </template>

      <template
        #map-content="{
          geojson,
          hoveredId,
          selectedId,
          mobileControlsTarget,
          onHover,
          onHoverEnd,
          onSelect,
        }"
      >
        <MapNavigationControl v-if="!isMobile" position="bottom-right" />
        <BasemapToggle
          position="top-right"
          :teleport-to="isMobile ? mobileControlsTarget : undefined"
        />
        <!-- No @error handler by design: GeolocationButton shows its own callout
             when location is blocked; other geolocation errors are non-blocking
             since the finder works without location. -->
        <GeolocationButton
          position="bottom-right"
          :teleport-to="isMobile ? mobileControlsTarget : undefined"
          @located="handleGeolocate"
        />

        <CircleLayer
          v-if="geojson"
          id="locations"
          :source="{ type: 'geojson', data: toRaw(geojson) as any }"
          :paint="{
            'circle-radius': [
              'case',
              ['==', ['get', 'id'], selectedId ?? ''],
              12,
              ['==', ['get', 'id'], hoveredId ?? ''],
              10,
              7,
            ],
            'circle-color': [
              'case',
              ['==', ['get', 'id'], selectedId ?? ''],
              '#0D47A1',
              ['==', ['get', 'id'], hoveredId ?? ''],
              '#1976D2',
              '#1976D2',
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
          }"
          @mouseenter="(e: any) => onHover(e.features?.[0]?.properties?.id)"
          @mouseleave="onHoverEnd"
          @click="
            (e: any) => {
              const feature = e.features?.[0]
              if (!feature) return
              const loc = locationsWithDistance.find((l) => l.id === feature.properties?.id)
              if (loc) onSelect(loc)
            }
          "
        />
      </template>
    </PinboardBody>
>>>>>>> 8936801 (removes console.log if error occurs, leaves note about reasoning)
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
      <h2 class="has-text-heading-5">{{ t('callout.title') }}</h2>
      <span class="has-text-body-small">
        {{ t('callout.message') }}
        <RouterLink to="/info" @click="closeInfoSheet">{{ t('callout.linkText') }}</RouterLink>
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

.phila-navbar-brand {
  padding-left: var(--spacing-l);
}

/* Allow tooltip bubbles to escape the card boundary (overflow:hidden clips them otherwise) */
.location-card--custom {
  overflow: visible !important;
  overflow-x: clip !important;
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
  transition: opacity 0.25s ease-out;
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
