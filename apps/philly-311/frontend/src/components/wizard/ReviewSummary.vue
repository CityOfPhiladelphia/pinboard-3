<!-- ABOUTME: Read-only summary of the report wizard store for the Review step.
     Four sections (photo, issue type + answers, location, details), each with an Edit link. -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useServiceTypes } from '@/composables/useServiceTypes'

const store = useReportSubmissionStore()
const { list, load } = useServiceTypes()
onMounted(() => {
  load()
})

const photoSrc = computed(() => store.photo?.previewUrl ?? store.photo?.mediaUrl ?? null)

/** Answered questions in catalog order, unknown fields last with the raw key as label. */
const answers = computed(() => {
  const entries = Object.entries(store.customFields)
  if (entries.length === 0) return []
  const questions = list.value?.find((s) => s.serviceType === store.category)?.questions ?? []
  const rank = new Map(questions.map((q, i) => [q.field, i]))
  const label = new Map(questions.map((q) => [q.field, q.label]))
  return entries
    .map(([field, value]) => ({
      field,
      label: label.get(field) ?? field,
      value,
      rank: rank.get(field) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => a.rank - b.rank)
})

const locationText = computed(() => {
  const loc = store.location
  if (!loc) return '—'
  const base = loc.address || `${loc.lat}, ${loc.lng}`
  return loc.zipCode ? `${base} (${loc.zipCode})` : base
})
</script>

<template>
  <div class="review-summary">
    <section class="review-summary__section">
      <header class="review-summary__header">
        <h2 class="review-summary__heading">Photo</h2>
        <RouterLink class="review-summary__edit" to="/report" aria-label="Edit photo">
          Edit
        </RouterLink>
      </header>
      <img
        v-if="photoSrc"
        class="review-summary__photo"
        :src="photoSrc"
        alt="Photo attached to this report"
      />
      <p v-else class="review-summary__value">—</p>
    </section>

    <section class="review-summary__section">
      <header class="review-summary__header">
        <h2 class="review-summary__heading">Issue type</h2>
        <RouterLink class="review-summary__edit" to="/report/issue-type" aria-label="Edit issue type">
          Edit
        </RouterLink>
      </header>
      <p class="review-summary__value">{{ store.category ?? '—' }}</p>
      <dl v-if="answers.length" class="review-summary__answers">
        <template v-for="a in answers" :key="a.field">
          <dt class="review-summary__dt">{{ a.label }}</dt>
          <dd class="review-summary__dd">{{ a.value }}</dd>
        </template>
      </dl>
    </section>

    <section class="review-summary__section">
      <header class="review-summary__header">
        <h2 class="review-summary__heading">Location</h2>
        <RouterLink class="review-summary__edit" to="/report/location" aria-label="Edit location">
          Edit
        </RouterLink>
      </header>
      <p class="review-summary__value">{{ locationText }}</p>
    </section>

    <section class="review-summary__section">
      <header class="review-summary__header">
        <h2 class="review-summary__heading">Details</h2>
        <RouterLink class="review-summary__edit" to="/report/details" aria-label="Edit details">
          Edit
        </RouterLink>
      </header>
      <dl class="review-summary__details">
        <dt class="review-summary__dt">Description</dt>
        <dd class="review-summary__dd">{{ store.description || '—' }}</dd>
        <dt class="review-summary__dt">Name</dt>
        <dd class="review-summary__dd">{{ store.contact.name || '—' }}</dd>
        <dt class="review-summary__dt">Email</dt>
        <dd class="review-summary__dd">{{ store.contact.email || '—' }}</dd>
        <dt class="review-summary__dt">Phone</dt>
        <dd class="review-summary__dd">{{ store.contact.phone || '—' }}</dd>
        <dt class="review-summary__dt">Public visibility</dt>
        <dd class="review-summary__dd">{{ store.publicVisibility ? 'Yes' : 'No' }}</dd>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.review-summary__section {
  border: 1px solid var(--ui-color-grey-200, #e3e3e3);
  border-radius: 8px;
  padding: var(--spacing-m, 1rem);
  margin-bottom: var(--spacing-m, 1rem);
}
.review-summary__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.review-summary__heading {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-s, 0.75rem);
}
.review-summary__edit {
  font-size: 0.875rem;
  color: var(--ui-color-primary, #0f4d90);
}
.review-summary__photo {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  object-fit: cover;
}
.review-summary__value {
  margin: 0;
}
.review-summary__answers,
.review-summary__details {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px var(--spacing-m, 1rem);
  margin: var(--spacing-s, 0.75rem) 0 0;
}
.review-summary__dt {
  font-weight: 600;
}
.review-summary__dd {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
