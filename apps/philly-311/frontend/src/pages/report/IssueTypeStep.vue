<!-- ABOUTME: Wizard step 2 — choose the issue type (photo recommendations + searchable
     caseType-grouped directory) and answer its conditional questions. View derives from
     store.category; Next is gated on required visible questions via useWizardValidity. -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useServiceTypes } from '@/composables/useServiceTypes'
import { useWizardValidity } from '@/composables/useWizardValidity'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { visibleQuestions } from '@/utils/conditional'
import { serviceTypeIconDefinition } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'
import TypeSuggestions from '@/components/wizard/TypeSuggestions.vue'
import TypeDirectory from '@/components/wizard/TypeDirectory.vue'
import QuestionField from '@/components/wizard/QuestionField.vue'

const store = useReportSubmissionStore()
const { list, isLoading, error, load } = useServiceTypes()
onMounted(() => {
  void load()
})
function retry() {
  void load()
}

const catalog = computed(() => list.value ?? [])
const selected = computed(() => catalog.value.find((s) => s.serviceType === store.category) ?? null)
const visible = computed(() =>
  selected.value
    ? visibleQuestions(selected.value.questions, store.customFields, selected.value.serviceType)
    : [],
)
const hasRequired = computed(() => visible.value.some((q) => q.required))

useWizardValidity(
  computed(
    () =>
      !!store.category &&
      visible.value.every((q) => !q.required || (store.customFields[q.field] ?? '') !== ''),
  ),
)

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

    <p v-if="isLoading && !catalog.length" class="issue-step__status">Loading issue types…</p>
    <p v-else-if="error" class="issue-step__error" role="alert">
      {{ error.message || 'Could not load issue types.' }}
      <button type="button" data-test="retry-types" class="issue-step__retry" @click="retry">
        Retry
      </button>
    </p>

    <template v-else-if="!store.category">
      <div v-if="store.photo" class="issue-step__photo-band">
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
        <span
          class="issue-step__selected-icon"
          :style="{ backgroundColor: serviceTypeColor(store.category) }"
        >
          <FontAwesomeIcon :icon="serviceTypeIconDefinition(store.category)" />
        </span>
        <span class="issue-step__selected-body">
          <span class="issue-step__selected-name">{{ store.category }}</span>
          <span v-if="selected" class="issue-step__selected-desc">{{ selected.description }}</span>
        </span>
        <button type="button" data-test="change-type" class="issue-step__change" @click="change">
          Change
        </button>
      </div>

      <p v-if="!visible.length" class="issue-step__status">
        No additional details needed for this issue type.
      </p>
      <template v-else>
        <p v-if="hasRequired" class="issue-step__legend">* Required</p>
        <div class="issue-step__questions">
          <QuestionField
            v-for="q in visible"
            :key="q.field"
            :question="q"
            :model-value="store.customFields[q.field] ?? ''"
            @update:model-value="store.setQuestion(q.field, $event)"
          />
        </div>
      </template>
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
.issue-step__selected-icon {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
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
.issue-step__questions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m, 1rem);
  max-width: 640px;
}
.issue-step__legend {
  color: var(--ui-color-grey-700, #4a4a4a);
  font-size: 0.875rem;
}
.issue-step__error {
  color: var(--ui-color-red, #c0392b);
}
.issue-step__retry {
  background: none;
  border: 1px solid var(--ui-color-primary, #0f4d90);
  border-radius: 9999px;
  color: var(--ui-color-primary, #0f4d90);
  padding: 2px 12px;
  margin-left: var(--spacing-s, 0.75rem);
  cursor: pointer;
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
