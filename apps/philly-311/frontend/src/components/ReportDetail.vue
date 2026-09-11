<!-- ABOUTME: Inline detail for a selected 311 report in Pinboard's location-detail slot.
     Renders instantly from the lightweight Report the map/list already has, then fetches
     the full issue (customFields, private) by id and swaps it in via ReportDetailContent.
     Also keeps ReportDetailContent's active sub-panel (I see this / Activity) in sync
     with a ?panel= URL query param, so a sub-panel URL can be copied and shared. -->
<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ReportDetailContent, { type SubpanelKey } from './ReportDetailContent.vue'
import { useIssue } from '@/composables/useIssue'
import { useAnonymousActivityStore } from '@/stores/anonymousActivity'
import type { Report } from '@/composables/useNearbyReports'
import type { Issue } from '@/types/api'

const props = withDefaults(
  defineProps<{ report: Report; onClose: () => void; showUpvote?: boolean }>(),
  // An absent optional boolean prop is cast to false by Vue, not undefined —
  // default it to true so Upvote shows unless a caller explicitly opts out.
  { showUpvote: true },
)

const { issue, isUpvoting, upvoteError, load, upvote } = useIssue()
const anonymousActivity = useAnonymousActivityStore()

const route = useRoute()
const router = useRouter()

const VALID_SUBPANELS: ReadonlySet<string> = new Set(['upvote', 'activity'] satisfies SubpanelKey[])
const initialSubpanel = computed<SubpanelKey | undefined>(() => {
  const panel = route.query.panel
  return typeof panel === 'string' && VALID_SUBPANELS.has(panel)
    ? (panel as SubpanelKey)
    : undefined
})

// push (not replace), matching PinboardBody's own ?location= sync, so Back closes the
// sub-panel before it closes the report itself. Guarded against re-pushing a value the
// URL already has — both to avoid looping with ReportDetailContent's own
// initialSubpanel watcher, and to avoid spamming history on every render.
function handleSubpanelChange(panel: SubpanelKey | null) {
  const current = typeof route.query.panel === 'string' ? route.query.panel : null
  if (current === panel) return
  const query = { ...route.query }
  if (panel) query.panel = panel
  else delete query.panel
  router.push({ query })
}

// The API 400s if you try to upvote a report you submitted yourself, but it can only
// catch that server-side for a signed-in submitter (it has no account to check an
// anonymous one against) — same reason the upvote itself can't be deduped anonymously.
// Suppress the action client-side for both cases rather than surfacing that error.
const canUpvote = computed(
  () => props.showUpvote && !anonymousActivity.isSubmitted(props.report.id),
)
const alreadyUpvoted = computed(() => anonymousActivity.isUpvoted(props.report.id))

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
  (id, previousId) => {
    void load(id)
    // A different report was selected while a sub-panel was open (e.g. clicking
    // another pin) — don't carry that sub-panel over to it.
    if (previousId !== undefined && previousId !== id) handleSubpanelChange(null)
  },
  { immediate: true },
)

onUnmounted(() => handleSubpanelChange(null))

function handleUpvote(description: string): Promise<boolean> {
  return upvote(props.report.id, description)
}
</script>

<template>
  <ReportDetailContent
    :report="displayIssue"
    :on-close="onClose"
    :show-upvote="canUpvote"
    :already-upvoted="alreadyUpvoted"
    :upvoting="isUpvoting"
    :upvote-error="upvoteError"
    :on-upvote="handleUpvote"
    :initial-subpanel="initialSubpanel"
    :on-subpanel-change="handleSubpanelChange"
  />
</template>
