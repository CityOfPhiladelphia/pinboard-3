<!-- ABOUTME: Read-only summary of the report wizard store for the Review step.
     Five sections (images, issue type, location, details, visibility & contact)
     in ReviewSectionCard chrome. The first four Edit to the step that owns them;
     visibility & contact instead opens VisibilityContactModal. -->
<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from 'vue'
import { useAuth } from '@phila/sso-vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useServiceTypes } from '@/composables/useServiceTypes'
import { serviceTypeIconComponent } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'
import { LocationThumbnail } from '@pinboard/ui'
import ReviewSectionCard from './ReviewSectionCard.vue'
import VisibilityContactModal from './VisibilityContactModal.vue'
import {
  IconImage,
  IconFolder,
  IconLocationDot,
  IconCircleQuestion,
  IconUsers,
} from '@phila/phila-ui-core/icons'

const CITY_STATE = 'Philadelphia, PA'

const store = useReportSubmissionStore()
const auth = useAuth()
const { list, load } = useServiceTypes()
onMounted(() => {
  load()
})

const visibilityContactModal = useTemplateRef('visibilityContactModal')

/** Contact summary line under the visibility & contact section. Signed-in
 *  users' contact comes from their account, not this wizard, so it's never
 *  shown as unshared even though shareContactInfo/contact aren't set. */
const contactSummary = computed(() => {
  if (auth.isAuthenticated.value) return 'Contact info is linked to your account'
  if (store.shareContactInfo && store.contact.name && store.contact.phone) {
    return `Shared: ${store.contact.name}, ${store.contact.phone}`
  }
  return 'Contact info not shared'
})

const photoSrc = computed(() => store.photo?.previewUrl ?? store.photo?.mediaUrl ?? null)

const category = computed(() => list.value?.find((s) => s.serviceType === store.category) ?? null)

/** Answered questions in catalog order, unknown fields last with the raw key as label. */
const answers = computed(() => {
  const entries = Object.entries(store.customFields)
  if (entries.length === 0) return []
  const questions = category.value?.questions ?? []
  const rank = new Map(questions.map((q, i) => [q.field, i]))
  const label = new Map(questions.map((q) => [q.field, q.label]))
  const required = new Map(questions.map((q) => [q.field, q.required]))
  return entries
    .map(([field, value]) => ({
      field,
      label: label.get(field) ?? field,
      value,
      required: required.get(field) ?? false,
      rank: rank.get(field) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => a.rank - b.rank)
})

/** Category answers, then the free-text description, as one list of label/value rows. */
const detailRows = computed(() => [
  ...answers.value.map((a) => ({
    field: a.field,
    label: a.required ? `${a.label} * (required)` : a.label,
    value: a.value,
  })),
  {
    field: '__description',
    label: 'Describe the issue * (required)',
    value: store.description || '—',
  },
])

const locationIcon = computed(() => serviceTypeIconComponent(store.category))
const locationColor = computed(() => serviceTypeColor(store.category))
const locationLines = computed(() => {
  const loc = store.location
  if (!loc) return null
  return {
    street: loc.streetAddress || null,
    cityStateZip: loc.zipCode ? `${CITY_STATE} ${loc.zipCode}` : CITY_STATE,
    coords: `${loc.lat}, ${loc.lng}`,
  }
})
</script>

<template>
  <div class="review-summary">
    <ReviewSectionCard :icon="IconImage" label="Images" edit-to="/report" edit-label="Edit photo">
      <img
        v-if="photoSrc"
        class="review-summary__photo"
        :src="photoSrc"
        alt="Photo attached to this report"
      />
      <p v-else class="review-summary__value">—</p>
    </ReviewSectionCard>

    <ReviewSectionCard
      :icon="IconFolder"
      label="Issue type"
      edit-to="/report/issue-type"
      edit-label="Edit issue type"
    >
      <p class="review-summary__value">{{ store.category ?? '—' }}</p>
      <p v-if="category?.description" class="review-summary__category-description">
        {{ category.description }}
      </p>
    </ReviewSectionCard>

    <ReviewSectionCard
      :icon="IconLocationDot"
      label="Location"
      edit-to="/report/location"
      edit-label="Edit location"
    >
      <div v-if="locationLines" class="review-summary__location">
        <div class="review-summary__map">
          <LocationThumbnail
            :latitude="store.location?.lat"
            :longitude="store.location?.lng"
            :icon="locationIcon"
            :color="locationColor"
          />
        </div>
        <div class="review-summary__location-text">
          <div v-if="locationLines.street" class="review-summary__location-street">
            {{ locationLines.street }}
          </div>
          <div class="review-summary__location-line">{{ locationLines.cityStateZip }}</div>
          <div class="review-summary__location-line">{{ locationLines.coords }}</div>
        </div>
      </div>
      <p v-else class="review-summary__value">—</p>
    </ReviewSectionCard>

    <ReviewSectionCard
      :icon="IconCircleQuestion"
      label="Details"
      edit-to="/report/details"
      edit-label="Edit details"
    >
      <dl class="review-summary__details">
        <template v-for="row in detailRows" :key="row.field">
          <dt class="review-summary__dt">{{ row.label }}</dt>
          <dd class="review-summary__dd">{{ row.value }}</dd>
        </template>
      </dl>
    </ReviewSectionCard>

    <ReviewSectionCard
      :icon="IconUsers"
      label="Visibility & contact"
      edit-label="Edit visibility and contact info"
      @edit="visibilityContactModal?.open()"
    >
      <p class="review-summary__value">{{ store.publicVisibility ? 'Public' : 'Private' }}</p>
      <p class="review-summary__category-description">{{ contactSummary }}</p>
    </ReviewSectionCard>
  </div>

  <VisibilityContactModal ref="visibilityContactModal" />
</template>

<style scoped>
.review-summary {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-l, 1.5rem);
}
.review-summary__photo {
  max-width: 247px;
  max-height: 200px;
  border-radius: var(--border-radius-l, 16px);
  object-fit: cover;
}
.review-summary__value {
  margin: 0;
}
.review-summary__category-description {
  margin: var(--spacing-s, 0.75rem) 0 0;
  color: var(--Schemes-On-Surface-High, #000);
}
.review-summary__location {
  display: flex;
  align-items: center;
  gap: var(--spacing-l, 1.5rem);
  width: 100%;
  /* No padding, per Figma — the map sits flush against this background
   * (matching border-radius on both), reading as one connected widget.
   * Literal color: --Schemes-On-Primary (Figma's token for this fill)
   * resolves to white in @phila/phila-ui-core, not grey — no shipped
   * variable matches Figma's actual #f5f5f5 here. */
  background: #f5f5f5;
  border-radius: var(--border-radius-s, 8px);
  box-sizing: border-box;
}
.review-summary__map {
  flex-shrink: 0;
  width: 222px;
  height: 186px;
  border: 1px solid var(--Schemes-Border-low, #ccc);
  border-radius: var(--border-radius-s, 8px);
  overflow: hidden;
}
.review-summary__location-text {
  flex: 1 1 0;
  min-width: 0;
}

/* The map's fixed 222px width + flex-shrink:0 never gives up room to the
 * address text, so on a narrow phone the row either overflows or squeezes
 * the text illegibly thin. Stacking the map above the text avoids both. */
@media (max-width: 768px) {
  .review-summary__location {
    flex-direction: column;
    align-items: stretch;
  }
  .review-summary__map {
    width: 100%;
  }
  /* Stacked, the text has nothing to its left (the map sits above it, not
   * beside it) or below (it's the last element) — desktop needs neither,
   * since the map and the card's own edge fill those roles instead. */
  .review-summary__location-text {
    padding: 0 0 var(--spacing-m, 1rem) var(--spacing-m, 1rem);
  }
}
.review-summary__location-street {
  font-weight: 600;
}
.review-summary__details {
  display: flex;
  flex-direction: column;
  margin: 0;
  width: 100%;
}
.review-summary__dt {
  font-weight: 600;
  margin-top: var(--spacing-m, 1rem);
}
.review-summary__dt:first-child {
  margin-top: 0;
}
.review-summary__dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--Schemes-On-Surface-Low, #636363);
}
</style>
