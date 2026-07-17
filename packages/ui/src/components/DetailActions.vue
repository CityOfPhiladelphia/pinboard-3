<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhilaButton } from '@phila/phila-ui-button'
import { Tooltip } from '@phila/phila-ui-tooltip'
import { IconPrint, IconShareNodes, IconCheck } from '@phila/phila-ui-core/icons'

defineProps<{
  onPrint?: () => void
}>()

const { t } = useI18n()

// How long the "copied" confirmation stays up after a share click.
const COPIED_MS = 5000

const shareTip = ref<{ show: () => void; hide: () => void } | null>(null)
const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

async function handleShare() {
  try {
    await navigator.clipboard.writeText(window.location.href)
  } catch {
    // Clipboard unavailable (e.g. insecure context) — don't show a false confirmation.
    return
  }
  copied.value = true
  // While `copied`, the tooltip's trigger flips to "click" so it has no
  // mouseleave auto-hide; wait for that to bind before forcing it open, then
  // it stays up until the timer (or an outside click / Esc) dismisses it.
  await nextTick()
  shareTip.value?.show()
  if (resetTimer) clearTimeout(resetTimer)
  resetTimer = setTimeout(() => {
    copied.value = false
    shareTip.value?.hide()
  }, COPIED_MS)
}

onBeforeUnmount(() => {
  if (resetTimer) clearTimeout(resetTimer)
})
</script>

<template>
  <div class="detail-actions">
    <Tooltip ref="shareTip" type="plain" :trigger="copied ? 'click' : 'hover'">
      <PhilaButton
        :icon="copied ? IconCheck : IconShareNodes"
        :icon-only="true"
        variant="standard"
        size="small"
        :aria-label="t('pinboard.share')"
        @click="handleShare"
      />
      <template #body>{{ copied ? t('pinboard.copiedUrl') : t('pinboard.share') }}</template>
    </Tooltip>

    <span class="detail-actions-status" aria-live="polite">{{
      copied ? t('pinboard.copiedUrl') : ''
    }}</span>

    <Tooltip v-if="onPrint" type="plain" trigger="hover">
      <PhilaButton
        :icon="IconPrint"
        :icon-only="true"
        variant="standard"
        size="small"
        :aria-label="t('pinboard.print')"
        @click="onPrint"
      />
      <template #body>{{ t('pinboard.print') }}</template>
    </Tooltip>
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
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
