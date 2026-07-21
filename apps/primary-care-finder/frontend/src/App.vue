<script setup lang="ts">
import '@pinboard/ui/style.css'
import { PinboardShell, PinboardComposables, languages } from '@pinboard/ui'
import { BottomSheet } from '@phila/phila-ui-bottom-sheet'
import { CloseButton } from '@phila/phila-ui-button'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const {
  locale,
  setLocale,
  infoSheetOpen,
  isDraggingSheet,
  dragY,
  closeInfoSheet,
  onSheetPointerDown,
} = PinboardComposables.useInitPinboardApp('pcf')

const feedbackHref =
  'https://www.phila.gov/departments/department-of-public-health/about-us/contact-us/#send-us-a-message'
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
