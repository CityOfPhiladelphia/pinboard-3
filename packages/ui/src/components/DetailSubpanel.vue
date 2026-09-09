<!-- ABOUTME: Reusable chrome for a sub-panel pushed into a detail panel in place of its
     main content (e.g. philly-311's ReportDetailContent swaps in an "I see this" panel
     from its hero-toolbar buttons, with Activity next). Renders a header — a labeled
     Back button, centered title, and an optional Close button — above a scrolling body
     and an optional pinned footer action. The owning component decides which sub-panel
     (if any) is active and what fills the slots; this only supplies the navigation shell
     around it. -->
<script setup lang="ts">
import { CloseButton, PhilaButton } from '@phila/phila-ui-button'
import { IconChevronLeft } from '@phila/phila-ui-core/icons'
import { Tooltip } from '@phila/phila-ui-tooltip'

defineProps<{
  title: string
  backLabel: string
  onBack: () => void
  onClose?: () => void
}>()
</script>

<template>
  <div class="detail-subpanel">
    <div class="detail-subpanel__header">
      <PhilaButton
        :icon="IconChevronLeft"
        variant="text-flat"
        size="small"
        class="detail-subpanel__back"
        data-test="subpanel-back"
        @click="onBack"
      >
        {{ backLabel }}
      </PhilaButton>
      <h2 class="detail-subpanel__title has-text-label-large">{{ title }}</h2>
      <div v-if="onClose" class="detail-subpanel__close">
        <Tooltip type="plain" trigger="hover">
          <CloseButton size="small" @click="onClose" />
          <template #body>Close</template>
        </Tooltip>
      </div>
    </div>
    <div class="detail-subpanel__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="detail-subpanel__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.detail-subpanel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.detail-subpanel__header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  flex-shrink: 0;
  gap: var(--spacing-s, 0.75rem);
  padding: var(--spacing-m, 1rem);
}
.detail-subpanel__back {
  justify-self: start;
  min-width: 0;
  --phila-button-color: var(--Schemes-On-Surface-Low, #636363);
}
.detail-subpanel__title {
  grid-column: 2;
  margin: 0;
  text-align: center;
  white-space: nowrap;
  color: var(--Schemes-On-Surface-High, #000);
}
.detail-subpanel__close {
  grid-column: 3;
  justify-self: end;
}
.detail-subpanel__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-l, 1.5rem);
  padding: 0 var(--spacing-m, 1rem) var(--spacing-m, 1rem);
}
.detail-subpanel__footer {
  flex-shrink: 0;
  padding: var(--spacing-m, 1rem);
}
</style>
