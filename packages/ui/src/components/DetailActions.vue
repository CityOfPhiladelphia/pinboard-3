<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhilaButton } from '@phila/phila-ui-button'
import { IconPrint, IconShareNodes, IconCheck } from '@phila/phila-ui-core/icons'

defineProps<{
  onPrint?: () => void
}>()

const { t } = useI18n()

const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

async function handleShare() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    if (resetTimer) clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Clipboard unavailable (e.g. insecure context) — leave the button as-is.
  }
}

onBeforeUnmount(() => {
  if (resetTimer) clearTimeout(resetTimer)
})
</script>

<template>
  <div class="detail-actions">
    <PhilaButton
      :icon="copied ? IconCheck : IconShareNodes"
      :icon-only="true"
      variant="standard"
      size="small"
      :aria-label="t('pinboard.share')"
      :title="copied ? t('pinboard.copiedUrl') : t('pinboard.share')"
      @click="handleShare"
    />
    <span class="detail-actions-status" aria-live="polite">{{
      copied ? t('pinboard.copiedUrl') : ''
    }}</span>
    <PhilaButton
      v-if="onPrint"
      :icon="IconPrint"
      :icon-only="true"
      variant="standard"
      size="small"
      :aria-label="t('pinboard.print')"
      :title="t('pinboard.print')"
      @click="onPrint"
    />
  </div>
</template>

<style scoped>
.detail-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

/* Match the detail's close button rather than the default primary (blue). */
.detail-actions :deep(svg) {
  color: var(--Schemes-On-Primary-Container);
}

/* Visually-hidden live region announcing the copy confirmation to screen readers. */
.detail-actions-status {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
