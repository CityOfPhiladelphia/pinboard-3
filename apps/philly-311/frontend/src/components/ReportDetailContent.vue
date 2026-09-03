<!-- ABOUTME: Full report-details view (Figma "Report details"): a full-bleed photo hero
     (status pill + action icons floating on it), title/description, a static Request
     Number card, a location map, a Next Steps progress tracker, and the service type's
     custom-field answers. Shared by the location-detail panel (map pin / my-requests
     selection) and the post-submit confirmation page. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { CloseButton, PhilaButton } from '@phila/phila-ui-button'
import { Callout } from '@phila/phila-ui-callout'
import { Icon } from '@phila/phila-ui-core'
import {
  IconArrowRight,
  IconCheckDouble,
  IconCircleInfo,
  IconClock,
  IconComments,
  IconCopy,
  IconBars,
  IconLocationDot,
} from '@phila/phila-ui-core/icons'
import { DetailActions, LocationThumbnail, Tags, Tooltip } from '@pinboard/ui'
import ReportStepProgress from './ReportStepProgress.vue'
import type { Issue } from '@/types/api'
import {
  statusBucket,
  statusTagColor,
  statusTagIcon,
  statusTagStyle,
} from '@/composables/useReportStatus'
import { useReportSteps } from '@/composables/useReportSteps'
import { serviceTypeColor, serviceTypeTintStyle } from '@/utils/serviceTypeMeta'
import { serviceTypeIconComponent } from '@/utils/reportIcon'

const props = withDefaults(
  defineProps<{
    report: Issue
    onClose?: () => void
    /** Hide the Upvote action even when onUpvote is provided (e.g. the user's own report). */
    showUpvote?: boolean
    upvoting?: boolean
    upvoteError?: string | null
    /** Resolves to whether the upvote succeeded, so the dialog can stay open to retry on failure. */
    onUpvote?: (description: string) => Promise<boolean>
    /** Show the location map thumbnail — only the confirmation page needs it; the
     *  location-detail flyout already overlays a map with the same pin. */
    showMap?: boolean
  }>(),
  {
    // An absent optional boolean prop is cast to false by Vue, not undefined —
    // default it to true so Upvote shows unless a caller explicitly opts out.
    showUpvote: true,
    onClose: undefined,
    upvoteError: null,
    onUpvote: undefined,
    showMap: false,
  },
)

const bucket = computed(() => statusBucket(props.report.status))

const placeholderStyle = computed(() => serviceTypeTintStyle(props.report.serviceType))
const placeholderIcon = computed(() => serviceTypeIconComponent(props.report.serviceType))

function formatWhen(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('en-US', { timeZone: 'America/New_York' })
}

// slaDate is a date-only field ("YYYY-MM-DD", parsed as UTC midnight), so format
// in UTC to avoid rendering the previous day in local time.
function formatDeadline(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { timeZone: 'UTC' })
}

const metaWhen = computed(() => formatWhen(props.report.updatedAt ?? props.report.createdAt))

const steps = computed(() => useReportSteps(props.report))

const requestNumber = computed(() => props.report.caseNumber ?? props.report.id)

// The SLA callout defaults to closed; start it open (the user can still collapse it).
const slaOpen = ref(true)

const upvoteDialog = ref<HTMLDialogElement | null>(null)
const upvoteDescription = ref('')

function openUpvoteDialog() {
  upvoteDescription.value = ''
  upvoteDialog.value?.showModal?.()
}
function closeUpvoteDialog() {
  upvoteDialog.value?.close?.()
}
async function confirmUpvote() {
  const description = upvoteDescription.value.trim()
  if (!description || !props.onUpvote) return
  const succeeded = await props.onUpvote(description)
  if (succeeded) closeUpvoteDialog()
}

// Activity isn't wired to the real comments API yet (GET/POST
// /private/key/issues/:id/comments) — UX is still designing that flow. This
// just makes the button interactive instead of disabled, with a placeholder.
const activityDialog = ref<HTMLDialogElement | null>(null)
function openActivityDialog() {
  activityDialog.value?.showModal?.()
}
function closeActivityDialog() {
  activityDialog.value?.close?.()
}
</script>

<template>
  <div class="report-detail">
    <div class="report-detail__body">
      <div class="report-detail__hero-toolbar-anchor">
        <div class="report-detail__hero-toolbar">
          <div class="report-detail__hero-actions">
            <Tooltip v-if="onUpvote && showUpvote" type="plain" trigger="hover">
              <PhilaButton
                :icon="IconCheckDouble"
                :icon-only="true"
                variant="standard"
                size="small"
                aria-label="I see this"
                @click="openUpvoteDialog"
              />
              <template #body>I see this</template>
            </Tooltip>
            <Tooltip type="plain" trigger="hover">
              <PhilaButton
                :icon="IconComments"
                :icon-only="true"
                variant="standard"
                size="small"
                aria-label="Activity"
                @click="openActivityDialog"
              />
              <template #body>Activity</template>
            </Tooltip>
            <DetailActions />
          </div>
          <div v-if="onClose" class="report-detail__close">
            <Tooltip type="plain" trigger="hover">
              <CloseButton size="small" @click="onClose" />
              <template #body>Close</template>
            </Tooltip>
          </div>
        </div>
      </div>

      <div class="report-detail__hero" :style="report.mediaUrl ? undefined : placeholderStyle">
        <img
          v-if="report.mediaUrl"
          :src="report.mediaUrl"
          :alt="report.serviceType"
          class="report-detail__hero-img"
        />
        <Icon
          v-else
          :icon="placeholderIcon"
          decorative
          size="extra-large"
          class="report-detail__hero-placeholder-icon"
        />

        <Tags
          v-if="bucket"
          class="report-detail__hero-status"
          variant="readonly"
          size="medium"
          :color="statusTagColor(bucket)"
          :icon="statusTagIcon(bucket)"
          :style="statusTagStyle(bucket)"
          :text="report.status"
        />
      </div>

      <div class="report-detail__body-inner">
        <div class="report-detail__title-block">
          <div class="report-detail__title has-text-label-xlarge">{{ report.serviceType }}</div>
          <div v-if="report.address || metaWhen" class="report-detail__meta">
            <span v-if="report.address" class="report-detail__meta-item">
              <Icon :icon="IconLocationDot" decorative size="extra-small" />
              {{ report.address }}
            </span>
            <span v-if="metaWhen" class="report-detail__meta-item">
              <Icon :icon="IconClock" decorative size="extra-small" />
              {{ metaWhen }}
            </span>
          </div>
        </div>

        <div v-if="report.description" class="report-detail__desc">{{ report.description }}</div>

        <div class="report-detail__request-card">
          <Icon :icon="IconCopy" decorative size="medium" />
          <div class="report-detail__request-card-text">
            <div class="report-detail__request-card-label">Service Request #</div>
            <div class="report-detail__request-card-value">{{ requestNumber }}</div>
          </div>
        </div>

        <div v-if="showMap" class="report-detail__map-thumb">
          <LocationThumbnail
            :latitude="report.latitude"
            :longitude="report.longitude"
            :icon="placeholderIcon"
            :color="serviceTypeColor(report.serviceType)"
          />
        </div>

        <div class="report-detail__next-steps">
          <div class="report-detail__section-title has-text-label-xlarge">
            <span class="report-detail__next-steps-icon">
              <Icon :icon="IconArrowRight" decorative size="extra-small" />
            </span>
            Next Steps
          </div>
          <Callout
            v-if="report.slaDate"
            v-model:open="slaOpen"
            class="report-detail__sla"
            type="info"
            title="Estimated update"
            :message="`Report will be reviewed by: ${formatDeadline(report.slaDate)}`"
          />
        </div>
        <ReportStepProgress :sections="steps.sections" :current-step="steps.currentStep" />
        <div
          v-if="report.customFields?.some((cf) => cf.value)"
          class="report-detail__additional-details"
        >
          <div class="report-detail__section-title has-text-label-xlarge">
            <Icon :icon="IconCircleInfo" decorative size="small" />
            Additional details
          </div>
          <div class="report-detail__custom-fields">
            <div
              v-for="cf in (report.customFields ?? []).filter((cf) => cf.value)"
              :key="cf.field"
              class="report-detail__custom-field"
            >
              <Icon :icon="IconBars" decorative size="extra-small" />
              <div class="report-detail__custom-field-text">
                <div class="report-detail__custom-field-label">{{ cf.label }}</div>
                <div class="report-detail__custom-field-value">{{ cf.value }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <dialog
      v-if="onUpvote && showUpvote"
      ref="upvoteDialog"
      class="report-detail__dialog"
      aria-labelledby="upvote-dialog-title"
      @close="closeUpvoteDialog"
      @cancel="closeUpvoteDialog"
    >
      <h2 id="upvote-dialog-title" class="report-detail__dialog-title">Upvote this report</h2>
      <div class="report-detail__dialog-body">Tell us about your experience with this issue.</div>
      <textarea
        v-model="upvoteDescription"
        class="report-detail__upvote-textarea"
        placeholder="Same pothole, still there as of today."
        rows="3"
      />
      <div v-if="upvoteError" class="report-detail__upvote-error" role="alert">
        {{ upvoteError }}
      </div>
      <div class="report-detail__dialog-actions">
        <button
          type="button"
          class="report-detail__upvote-cancel"
          data-test="upvote-cancel"
          @click="closeUpvoteDialog"
        >
          Cancel
        </button>
        <PhilaButton
          variant="primary"
          data-test="upvote-confirm"
          :disabled="!upvoteDescription.trim() || upvoting"
          @click="confirmUpvote"
        >
          {{ upvoting ? 'Submitting…' : 'Submit' }}
        </PhilaButton>
      </div>
    </dialog>

    <dialog
      ref="activityDialog"
      class="report-detail__dialog"
      aria-labelledby="activity-dialog-title"
      @close="closeActivityDialog"
      @cancel="closeActivityDialog"
    >
      <h2 id="activity-dialog-title" class="report-detail__dialog-title">Activity</h2>
      <div class="report-detail__dialog-body">
        Comments and activity history for this report aren't available yet — check back soon.
      </div>
      <div class="report-detail__dialog-actions">
        <PhilaButton variant="primary" data-test="activity-close" @click="closeActivityDialog">
          Close
        </PhilaButton>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.report-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.report-detail__hero {
  position: relative;
  width: 100%;
  aspect-ratio: 579 / 253;
  overflow: hidden;
  background: var(--Sidewalk-Grey-700-Sidewalk-Grey, #f1f1f1);
}
.report-detail__hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.report-detail__hero-placeholder-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.report-detail__hero-status {
  position: absolute;
  left: var(--spacing-s, 0.75rem);
  bottom: var(--spacing-s, 0.75rem);
}

.report-detail__hero-toolbar-anchor {
  position: sticky;
  top: 0;
  height: 0;
  overflow: visible;
  z-index: 2;
}
.report-detail__hero-toolbar {
  position: absolute;
  top: var(--spacing-s, 0.75rem);
  right: var(--spacing-s, 0.75rem);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.5rem);
}
.report-detail__hero-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2xs, 0.25rem);
  padding: var(--spacing-2xs, 0.25rem);
  border-radius: var(--border-radius-full, 9999px);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.report-detail__close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xs, 0.25rem);
  border-radius: var(--border-radius-full, 9999px);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.report-detail__hero-actions :deep(.icon-button),
.report-detail__close :deep(.icon-button) {
  border-radius: var(--border-radius-full, 9999px) !important;
}

.report-detail__hero-actions :deep(.icon-button),
.report-detail__hero-actions :deep(.detail-actions svg),
.report-detail__close :deep(.icon-button) {
  color: var(--Schemes-On-Surface-Low, #636363) !important;
}
.report-detail__body {
  /* The chassis's detail panel (.detail-overlay / .bottom-sheet-detail) is a
     fixed-height flex column with overflow: hidden — it expects its slotted
     content to scroll itself rather than overflowing or getting clipped. This
     is now the single scroll container for everything: the sticky toolbar
     anchor, the hero photo, and the body-inner content all live inside it —
     only the toolbar itself stays pinned as the rest scrolls underneath. */
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
.report-detail__body-inner {
  /* Figma's "Content" container: every top-level section (title block,
     description, Request # card, map, Next Steps, the step tracker,
     Additional details) sits a uniform 1.5rem apart — one `gap` here instead
     of each section carrying its own ad-hoc margin.
     No top padding — the hero photo sits flush above it, edge-to-edge, so
     .report-detail__body itself carries no padding (that would inset the
     hero too); this is the one place side/bottom padding is applied. */
  display: flex;
  flex-direction: column;
  gap: var(--spacing-l, 1.5rem);
  padding: 0 var(--spacing-m, 1rem) var(--spacing-m, 1rem);
  max-width: 640px;
}
.report-detail__title-block {
  display: flex;
  flex-direction: column;
}
.report-detail__title {
  color: var(--Schemes-On-Surface-High, #000);
  margin: 0;
}
.report-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-m, 1rem);
  color: var(--Schemes-On-Surface-Low, #636363);
}
.report-detail__meta-item {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2xs, 0.25rem);
}
.report-detail__map-thumb {
  width: 100%;
  aspect-ratio: 579 / 169;
  border: 1px solid var(--Schemes-Border-low, #ccc);
  border-radius: 12px;
  overflow: hidden;
}
.report-detail__desc {
  margin: 0;
}
.report-detail__request-card {
  display: flex;
  align-items: center;
  background: var(--Sidewalk-Grey-700-Sidewalk-Grey, #f1f1f1);
  border: 1px solid var(--Schemes-Border-low, #ccc);
  border-radius: var(--border-radius-m, 12px);
  padding: var(--spacing-s, 0.75rem) var(--spacing-m, 1rem);
}
.report-detail__request-card-text {
  min-width: 0;
}
.report-detail__request-card-label {
  color: var(--Schemes-On-Surface, #343434);
}
.report-detail__request-card-value {
  font-size: 1rem;
  color: var(--Schemes-On-Background, #000);
}
.report-detail__next-steps,
.report-detail__additional-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m, 1rem);
}
.report-detail__section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.5rem);
  margin: 0;
}
.report-detail__next-steps-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--Schemes-On-Surface, #343434);
}
.report-detail__sla {
  margin: 0;
}

.report-detail__sla :deep(.callout-icon) {
  display: none;
}
.report-detail__custom-fields {
  border: 1px solid var(--Schemes-Border-low, #ccc);
  border-radius: var(--border-radius-l, 16px);
  padding: 0 var(--spacing-m, 1rem);
}
.report-detail__custom-field {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  padding: var(--spacing-s, 0.75rem) 0;
  border-bottom: 1px solid var(--Schemes-Border-low, #ccc);
}
.report-detail__custom-field:last-child {
  border-bottom: none;
}
.report-detail__custom-field-text {
  min-width: 0;
}
.report-detail__custom-field-label {
  margin: 0;
  font-weight: 600;
}
.report-detail__custom-field-value {
  margin: 0;
  color: var(--Schemes-On-Background, #000);
}
.report-detail__dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 28rem;
  width: 100%;
  padding: var(--spacing-l, 2rem);
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}
.report-detail__dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}
.report-detail__dialog-title {
  margin: 0 0 var(--spacing-s, 0.75rem);
}
.report-detail__dialog-body {
  margin: 0 0 var(--spacing-s, 0.75rem);
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
}
.report-detail__upvote-textarea {
  width: 100%;
  resize: vertical;
  font: inherit;
  padding: var(--spacing-s, 0.5rem);
  border: 1px solid var(--Schemes-Border-low, #ccc);
  border-radius: 8px;
}
.report-detail__upvote-error {
  color: var(--Schemes-Error, #b3261e);
  margin: var(--spacing-s, 0.5rem) 0 0;
}
.report-detail__dialog-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  margin-top: var(--spacing-l, 1.5rem);
}
.report-detail__upvote-cancel {
  margin-right: auto;
  background: none;
  border: none;
  color: var(--Schemes-Primary, #0f4d90);
  font-weight: 600;
  cursor: pointer;
}
</style>
