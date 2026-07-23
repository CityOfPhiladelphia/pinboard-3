<!-- ABOUTME: Wizard step 2 — choose the issue type (photo recommendations + searchable
     caseType-grouped directory). View derives from store.category; Next is gated on
     a category being chosen via useWizardValidity. -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useServiceTypes } from '@/composables/useServiceTypes'
import { useWizardValidity, useWizardErrors } from '@/composables/useWizardValidity'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { PhilaButton } from '@phila/phila-ui-button'
import ServiceTypeIcon from '@/components/ServiceTypeIcon.vue'
import TypeSuggestions from '@/components/wizard/TypeSuggestions.vue'
import TypeDirectory from '@/components/wizard/TypeDirectory.vue'

const store = useReportSubmissionStore()
const { list, isLoading, error, load } = useServiceTypes()
onMounted(() => {
  void load()
})

const catalog = computed(() => list.value ?? [])
const selected = computed(() => catalog.value.find((s) => s.serviceType === store.category) ?? null)
const hasSurvivingSuggestions = computed(() =>
  store.photoSuggestions.some((s) => catalog.value.some((c) => c.serviceType === s.serviceType)),
)

useWizardValidity(computed(() => !!store.category && !error.value))
const showErrors = useWizardErrors()

function pick(serviceType: string) {
  store.setCategory(serviceType)
}
function change() {
  store.setCategory(null)
}
</script>

<template>
  <div class="issue-step">
    <h1 class="issue-step__title">
      Issue type <span class="issue-step__required">* (required)</span>
    </h1>
    <p v-if="showErrors && !store.category" class="issue-step__error" role="alert">
      Select an issue type to continue
    </p>

    <p v-if="isLoading && !catalog.length" class="issue-step__status">Loading issue types…</p>
    <p v-else-if="error" class="issue-step__error" role="alert">
      {{ error.message || 'Could not load issue types.' }}
      <PhilaButton
        variant="secondary"
        class="issue-step__retry"
        data-test="retry-types"
        @click="() => void load()"
        >Retry</PhilaButton
      >
    </p>

    <template v-else-if="!store.category">
      <div v-if="store.photo && hasSurvivingSuggestions" class="issue-step__photo-band">
        <img
          class="issue-step__photo"
          :src="store.photo.previewUrl ?? store.photo.mediaUrl"
          alt="Your uploaded photo"
        />
        <TypeSuggestions :suggestions="store.photoSuggestions" :catalog="catalog" @select="pick" />
      </div>

      <h2 class="issue-step__subhead">All issue types</h2>
      <TypeDirectory :catalog="catalog" @select="pick" />
    </template>

    <template v-else>
      <div class="issue-step__selected">
        <ServiceTypeIcon :service-type="store.category" :size="36" />
        <span class="issue-step__selected-body">
          <span class="issue-step__selected-name">{{ store.category }}</span>
          <span v-if="selected" class="issue-step__selected-desc">{{ selected.description }}</span>
        </span>
        <button type="button" data-test="change-type" class="issue-step__change" @click="change">
          Change
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.issue-step__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-m, 1rem);
}
.issue-step__required {
  font-weight: 400;
  color: var(--ui-color-grey-700, #4a4a4a);
  font-size: 1rem;
}
.issue-step__retry {
  margin-left: var(--spacing-s, 0.75rem);
}
.issue-step__photo-band {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--spacing-m, 1rem);
  margin-bottom: var(--spacing-l, 2rem);
}
.issue-step__photo {
  width: 100%;
  max-height: 360px;
  object-fit: cover;
  border-radius: 8px;
}
.issue-step__subhead {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-s, 0.75rem);
}
.issue-step__selected {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  border: 1px solid var(--ui-color-primary, #0f4d90);
  border-radius: 8px;
  padding: var(--spacing-s, 0.75rem);
  margin-bottom: var(--spacing-m, 1rem);
}
.issue-step__selected-body {
  display: flex;
  flex-direction: column;
}
.issue-step__selected-name {
  font-weight: 700;
}
.issue-step__selected-desc {
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
.issue-step__change {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--ui-color-primary, #0f4d90);
  font-weight: 600;
  cursor: pointer;
}
.issue-step__error {
  color: var(--ui-color-red, #c0392b);
}
.issue-step__photo-band :deep(.type-suggestions) {
  align-self: start;
}
@media (max-width: 768px) {
  .issue-step__photo-band {
    grid-template-columns: 1fr;
  }
}
</style>
