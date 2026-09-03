<!-- ABOUTME: Post-submit confirmation — shows the full submitted report via
     ReportDetailContent, plus CTAs to start another report or browse nearby reports. -->
<script setup lang="ts">
import { onMounted, nextTick, ref } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { PhilaButton } from '@phila/phila-ui-button'
import { Icon } from '@phila/phila-ui-core'
import { IconCheck } from '@phila/phila-ui-core/icons'
import ReportDetailContent from '@/components/ReportDetailContent.vue'

const store = useReportSubmissionStore()
const heading = ref<HTMLElement | null>(null)

onMounted(async () => {
  await nextTick()
  heading.value?.focus()
})
</script>

<template>
  <div class="confirmation">
    <div class="confirmation__scroll">
      <div class="confirmation__status" role="status">
        <span class="confirmation__status-icon" aria-hidden="true">
          <Icon :icon="IconCheck" decorative size="large" />
        </span>
        <h1 ref="heading" tabindex="-1" class="confirmation__title">Success!</h1>
        <div class="confirmation__subtitle">Your report was submitted</div>
      </div>
      <ReportDetailContent
        v-if="store.submitted"
        class="confirmation__detail"
        :report="store.submitted"
        show-map
      />
    </div>
    <div class="confirmation__actions">
      <PhilaButton variant="primary" to="/report">Report another issue</PhilaButton>
      <RouterLink class="confirmation__link" to="/">See reports near you</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.confirmation {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  /* PinboardShell's .pinboard-main is a fixed-height flex box with overflow:
     hidden. .confirmation__scroll (banner + detail) scrolls as one region;
     the actions row below stays frozen on screen. */
  height: 100%;
}
.confirmation__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
.confirmation__status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-m, 1rem);
  flex-shrink: 0;
  padding: var(--spacing-l, 1.5rem) var(--spacing-m, 1rem);
  background: var(--Schemes-Success-Container, #caecc8);
  text-align: center;
}
.confirmation__status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: var(--border-radius-full, 9999px);
  background: var(--Palettes-Success-Success-300, #0c7216);
  color: var(--Schemes-Success-Container, #caecc8);
}
.confirmation__title {
  font-size: var(--Heading-H2-font-heading-2-size, 2.5rem);
  line-height: var(--Heading-H2-font-heading-2-lineheight, 1.2);
  font-weight: 600;
  margin: 0;
  color: var(--Schemes-On-Success-Container, #07570f);
}
.confirmation__subtitle {
  font-size: var(--Label-Large-font-label-large-size, 1.125rem);
  line-height: var(--Label-Large-font-label-large-lineheight, 1.5556);
  font-weight: 600;
  margin: 0;
  color: var(--Palettes-Success-Success-250, #07570f);
}
.confirmation__detail {
  margin: var(--spacing-l, 2rem) var(--spacing-m, 1rem) 0;
}
/* ReportDetailContent normally fills and scrolls within a fixed-height panel
   of its own (see ReportDetailContent.vue). Here it sits in normal flow
   inside .confirmation__scroll instead, which does the scrolling for both
   the banner and the detail card — so let it size to its content instead. */
.confirmation__detail :deep(.report-detail) {
  height: auto;
}
.confirmation__detail :deep(.report-detail__body) {
  flex: none;
  overflow: visible;
}
.confirmation__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: var(--spacing-m, 1rem);
  margin: var(--spacing-l, 2rem) var(--spacing-m, 1rem) var(--spacing-l, 2rem);
}
.confirmation__link {
  color: var(--Schemes-Primary, #0f4d90);
}
</style>
