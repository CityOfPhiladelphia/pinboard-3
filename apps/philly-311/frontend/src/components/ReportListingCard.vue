<!-- ABOUTME: Report listing card for the finder's left panel — a thin adapter from our
     Report data + status bucketing onto @phila/phila-ui-cards' Report311 component. -->
<script setup lang="ts">
import { computed } from 'vue'
import { Report311 } from '@phila/phila-ui-cards'
import type { Report311Props } from '@phila/phila-ui-cards'
import { Icon } from '@phila/phila-ui-core'
import type { Report } from '@/composables/useNearbyReports'
import {
  statusBucket,
  statusTagColor,
  statusTagIcon,
  statusTagStyle,
} from '@/composables/useReportStatus'
import { serviceTypeTintStyle } from '@/utils/serviceTypeMeta'
import { serviceTypeIconComponent } from '@/utils/reportIcon'
import { formatCardTimestamp } from '@/utils/datetime'

const props = defineProps<{ report: Report }>()

const timestamp = computed(() => formatCardTimestamp(props.report.createdAt) ?? undefined)
const bucket = computed(() => statusBucket(props.report.status))

const status = computed<Report311Props['status']>(() => {
  if (!bucket.value) return undefined
  return {
    text: props.report.status,
    color: statusTagColor(bucket.value),
    icon: statusTagIcon(bucket.value),
    style: statusTagStyle(bucket.value),
  }
})

const placeholderStyle = computed(() => serviceTypeTintStyle(props.report.serviceType))
const placeholderIcon = computed(() => serviceTypeIconComponent(props.report.serviceType))

// No-op: BaseCard only applies its own hover/focus styling when it considers
// itself "clickable" (isClickable = !!href || !!onClick — see Storybook's Report311
// story, which passes href="#" for the same reason). We don't want real anchor
// navigation here, so a listener is the lighter way to opt in. The actual card
// selection is handled by the wrapping .location-card div in LocationsPanel.vue;
// this click still bubbles up to it unchanged.
function onClick() {}
</script>

<template>
  <Report311
    :label="report.serviceType"
    :description="report.address"
    :timestamp="timestamp"
    :src="report.mediaUrl"
    :alt="report.serviceType"
    :status="status"
    @click="onClick"
  >
    <template #placeholder>
      <div class="listing-card__placeholder" :style="placeholderStyle">
        <Icon :icon="placeholderIcon" decorative size="medium" />
      </div>
    </template>
  </Report311>
</template>

<style scoped>
.listing-card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
