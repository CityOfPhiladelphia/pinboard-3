<!-- ABOUTME: Inline detail for a selected 311 report in Pinboard's location-detail slot.
     Renders instantly from the lightweight Report the map/list already has, then fetches
     the full issue (customFields, private) by id and swaps it in via ReportDetailContent. -->
<script setup lang="ts">
import { computed, watch } from 'vue'
import ReportDetailContent from './ReportDetailContent.vue'
import { useIssue } from '@/composables/useIssue'
import type { Report } from '@/composables/useNearbyReports'
import type { Issue } from '@/types/api'

const props = withDefaults(
  defineProps<{ report: Report; onClose: () => void; showUpvote?: boolean }>(),
  // An absent optional boolean prop is cast to false by Vue, not undefined —
  // default it to true so Upvote shows unless a caller explicitly opts out.
  { showUpvote: true },
)

const { issue, isUpvoting, upvoteError, load, upvote } = useIssue()

/** Placeholder Issue built from the lightweight Report, shown until the full fetch resolves. */
function reportToIssue(r: Report): Issue {
  return {
    id: r.id,
    caseNumber: r.id,
    status: r.status,
    serviceType: r.serviceType,
    department: r.department,
    address: r.address,
    description: r.description,
    mediaUrl: r.mediaUrl,
    createdAt: r.createdAt,
    slaDate: r.slaDate,
  }
}

const displayIssue = computed(() => issue.value ?? reportToIssue(props.report))

watch(
  () => props.report.id,
  (id) => void load(id),
  { immediate: true },
)

function handleUpvote(description: string): Promise<boolean> {
  return upvote(props.report.id, description)
}
</script>

<template>
  <ReportDetailContent
    :report="displayIssue"
    :on-close="onClose"
    :show-upvote="showUpvote"
    :upvoting="isUpvoting"
    :upvote-error="upvoteError"
    :on-upvote="handleUpvote"
  />
</template>
