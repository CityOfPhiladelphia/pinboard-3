<!-- ABOUTME: Full report-details view (Figma "Report details"): photo, status/private
     badges, description, upvote/share actions, a summary table, an SLA callout, and
     the service type's custom-field answers. Shared by the location-detail panel
     (map pin / my-requests selection) and the post-submit confirmation page. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { CloseButton, PhilaButton } from '@phila/phila-ui-button'
import { Callout } from '@phila/phila-ui-callout'
import { FilterChip } from '@phila/phila-ui-filter-chip'
import { Icon } from '@phila/phila-ui-core'
import { IconArrowUp, IconLock, IconGlobe, IconBars } from '@phila/phila-ui-core/icons'
import { DetailActions } from '@pinboard/ui'
import type { Issue } from '@/types/api'
import {
  statusBucket,
  statusTagColor,
  statusTagIcon,
  statusTagStyle,
} from '@/composables/useReportStatus'
import { serviceTypeTintStyle } from '@/utils/serviceTypeMeta'
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
  }>(),
  {
    // An absent optional boolean prop is cast to false by Vue, not undefined —
    // default it to true so Upvote shows unless a caller explicitly opts out.
    showUpvote: true,
    onClose: undefined,
    upvoteError: null,
    onUpvote: undefined,
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

// The SLA callout defaults to closed; start it open (the user can still collapse it).
const slaOpen = ref(true)

// Upvote and Share are hidden pending an updated design; the wiring underneath
// (props, dialog, useIssue calls) stays intact so this is a one-line flip to restore.
const SHOW_ACTIONS = false

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
</script>

<template>
  <div class="report-detail">
    <div class="report-detail__header">
      <h2 class="has-text-heading-5">{{ report.serviceType }}</h2>
      <CloseButton v-if="onClose" class="report-detail__close" @click="onClose" />
    </div>

    <div class="report-detail__body">
      <div class="report-detail__body-inner">
        <div v-if="bucket || report.private !== undefined" class="report-detail__badges">
          <FilterChip
            v-if="bucket"
            tabindex="-1"
            size="small"
            :color="statusTagColor(bucket)"
            :icon="statusTagIcon(bucket)"
            :style="statusTagStyle(bucket)"
            :text="report.status"
          />
          <FilterChip
            v-if="report.private !== undefined"
            tabindex="-1"
            size="small"
            color="white"
            style="cursor: default"
            :icon="report.private ? IconLock : IconGlobe"
            :text="report.private ? 'Private' : 'Public'"
          />
        </div>
        <img
          v-if="report.mediaUrl"
          :src="report.mediaUrl"
          :alt="report.serviceType"
          class="report-detail__img"
        />
        <div
          v-else
          class="report-detail__img report-detail__img--placeholder"
          :style="placeholderStyle"
          aria-hidden="true"
        >
          <Icon :icon="placeholderIcon" decorative size="extra-large" />
        </div>
        <p v-if="report.description" class="report-detail__desc">{{ report.description }}</p>
        <div v-if="SHOW_ACTIONS" class="report-detail__actions">
          <PhilaButton
            v-if="onUpvote && showUpvote"
            variant="standard"
            size="small"
            :icon="IconArrowUp"
            @click="openUpvoteDialog"
          >
            Upvote
          </PhilaButton>
          <DetailActions />
        </div>
        <table class="report-detail__fields">
          <tbody>
            <tr>
              <th scope="row">Issue type</th>
              <td>{{ report.serviceType }}</td>
            </tr>
            <tr>
              <th scope="row">Location</th>
              <td>{{ report.address }}</td>
            </tr>
            <tr v-if="report.createdAt">
              <th scope="row">Submitted</th>
              <td>{{ formatWhen(report.createdAt) }}</td>
            </tr>
            <tr>
              <th scope="row">Request ID</th>
              <td>{{ report.caseNumber ?? report.id }}</td>
            </tr>
          </tbody>
        </table>
        <Callout
          v-if="report.slaDate"
          v-model:open="slaOpen"
          class="report-detail__sla"
          type="info"
          title="Estimated update"
          :message="`Report will be reviewed by: ${formatDeadline(report.slaDate)}`"
        />
        <div
          v-if="report.customFields?.some((cf) => cf.value)"
          class="report-detail__custom-fields"
        >
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

    <dialog
      v-if="SHOW_ACTIONS && onUpvote && showUpvote"
      ref="upvoteDialog"
      class="report-detail__upvote-dialog"
      aria-labelledby="upvote-dialog-title"
      @close="closeUpvoteDialog"
      @cancel="closeUpvoteDialog"
    >
      <h2 id="upvote-dialog-title" class="report-detail__upvote-dialog-title">
        Upvote this report
      </h2>
      <p class="report-detail__upvote-dialog-body">
        Tell us about your experience with this issue.
      </p>
      <textarea
        v-model="upvoteDescription"
        class="report-detail__upvote-textarea"
        placeholder="Same pothole, still there as of today."
        rows="3"
      />
      <p v-if="upvoteError" class="report-detail__upvote-error" role="alert">{{ upvoteError }}</p>
      <div class="report-detail__upvote-actions">
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
  </div>
</template>

<style scoped>
.report-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.report-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-s, 0.75rem);
  padding: var(--spacing-m, 1rem);
  flex-shrink: 0;
}
.report-detail__header h2 {
  margin: 0;
}
.report-detail__close {
  flex-shrink: 0;
}
.report-detail__body {
  /* The chassis's detail panel (.detail-overlay / .bottom-sheet-detail) is a
     fixed-height flex column with overflow: hidden — it expects its slotted
     content to scroll itself rather than overflowing or getting clipped. The
     header above stays put; only this body scrolls. */
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--spacing-m, 1rem) var(--spacing-m, 1rem);
}
.report-detail__body-inner {
  /* .report-detail__body stays full width so its scrollbar sits at the edge
     of whatever panel it's in; the content itself is capped and left-aligned. */
  max-width: 640px;
}
.report-detail__img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}
.report-detail__img--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}
.report-detail__badges {
  display: flex;
  gap: var(--spacing-xs, 0.5rem);
  margin-bottom: var(--spacing-s, 0.5rem);
}
.report-detail__desc {
  margin: 0 0 var(--spacing-m, 1rem);
}
.report-detail__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  margin: var(--spacing-s, 0.5rem) 0;
}
.report-detail__fields {
  width: 100%;
  border-collapse: collapse;
  margin: var(--spacing-s, 0.5rem) 0;
}
.report-detail__fields tr {
  border-bottom: 1px solid var(--Schemes-Border-low, #ccc);
}
.report-detail__fields th {
  text-align: left;
  font-weight: bold;
  padding: 0.5rem 0.5rem 0.5rem 0;
}
.report-detail__fields td {
  padding: 0.5rem 0;
}
.report-detail__sla {
  margin: var(--spacing-s, 0.5rem) 0;
}
.report-detail__custom-fields {
  background: var(--Fills-Secondary, rgba(120, 120, 128, 0.16));
  border-radius: 16px;
  padding: var(--spacing-m, 1rem);
  margin: var(--spacing-s, 0.5rem) 0;
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
.report-detail__upvote-dialog {
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
.report-detail__upvote-dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}
.report-detail__upvote-dialog-title {
  margin: 0 0 var(--spacing-s, 0.75rem);
}
.report-detail__upvote-dialog-body {
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
.report-detail__upvote-actions {
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
