<!-- ABOUTME: Inline detail for a selected 311 report in Pinboard's location-detail slot:
     photo, status, service type, address, time, description, and (when showCaseFields is
     set) a fields table, SLA banner, and Share button for the My Requests case view. -->
<script setup lang="ts">
import { ref } from 'vue'
import { CloseButton } from '@phila/phila-ui-button'
import type { Report } from '@/composables/useNearbyReports'

defineProps<{ report: Report; onClose: () => void; showCaseFields?: boolean }>()

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

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined
async function share() {
  const url = window.location.href
  try {
    if (navigator.share) {
      await navigator.share({ url })
      return
    }
    await navigator.clipboard.writeText(url)
  } catch {
    return
  }
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <div class="report-detail">
    <CloseButton class="report-detail__close" @click="onClose" />
    <img
      v-if="report.mediaUrl"
      :src="report.mediaUrl"
      :alt="report.serviceType"
      class="report-detail__img"
    />
    <div v-else class="report-detail__img report-detail__img--placeholder" aria-hidden="true" />
    <h2 class="has-text-heading-5">{{ report.serviceType }}</h2>
    <p class="report-detail__status">{{ report.status }}</p>
    <p class="report-detail__address">{{ report.address }}</p>
    <p v-if="report.createdAt" class="report-detail__time">{{ formatWhen(report.createdAt) }}</p>
    <p v-if="report.description" class="report-detail__desc">{{ report.description }}</p>
    <div v-if="showCaseFields" class="report-detail__actions">
      <button type="button" class="report-detail__share" @click="share()">
        <span role="status">{{ copied ? 'Link copied' : 'Share' }}</span>
      </button>
    </div>
    <table v-if="showCaseFields" class="report-detail__fields">
      <tbody>
        <tr><th scope="row">Issue type</th><td>{{ report.serviceType }}</td></tr>
        <tr><th scope="row">Location</th><td>{{ report.address }}</td></tr>
        <tr v-if="report.createdAt"><th scope="row">Submitted</th><td>{{ formatWhen(report.createdAt) }}</td></tr>
        <tr><th scope="row">Request ID</th><td>{{ report.id }}</td></tr>
      </tbody>
    </table>
    <div v-if="showCaseFields && report.slaDate" class="report-detail__sla">
      <p class="report-detail__sla-title">Estimated update</p>
      <p>Report will be reviewed by: {{ formatDeadline(report.slaDate) }}</p>
    </div>
  </div>
</template>

<style scoped>
.report-detail {
  position: relative;
  padding: var(--spacing-m, 1rem);
}
.report-detail__close {
  position: absolute;
  top: 8px;
  right: 8px;
}
.report-detail__img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 6px;
}
.report-detail__img--placeholder {
  background: var(--ui-color-grey-200, #e5e5e5);
}
.report-detail h2 {
  margin: var(--spacing-s, 0.5rem) 0;
}
.report-detail__actions {
  margin: var(--spacing-s, 0.5rem) 0;
}
.report-detail__share {
  border: 1px solid var(--ui-color-primary, #1034f4);
  border-radius: 999px;
  background: #fff;
  padding: 0.375rem 1rem;
  cursor: pointer;
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
  background: #d4e6fb;
  border-radius: 6px;
  padding: var(--spacing-s, 0.5rem) 1rem;
}
.report-detail__sla-title {
  font-weight: bold;
  margin: 0 0 0.25rem;
}
</style>
