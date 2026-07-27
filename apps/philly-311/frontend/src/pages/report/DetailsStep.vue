<!-- ABOUTME: Wizard step 4 — details: walks the issue type's questions one per
     screen (auto-advancing single-choice answers), ending with the required
     description (10-char floor), contact info, and report visibility. -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useServiceTypes } from '@/composables/useServiceTypes'
import { useWizardNav } from '@/composables/useWizardNav'
import { visibleQuestions } from '@/utils/conditional'
import { PhilaButton } from '@phila/phila-ui-button'
import ContactInfo from '@/components/wizard/ContactInfo.vue'
import QuestionField from '@/components/wizard/QuestionField.vue'

const MIN_DESCRIPTION = 10
const AUTO_ADVANCE_MS = 300

const store = useReportSubmissionStore()
const { list, load, isLoading, error: loadError } = useServiceTypes()
onMounted(() => {
  void load()
})

// A deep link (?category=X) can land here before the catalog has loaded, or
// after it's failed to load — in both cases the category's questions are
// unknown, so question/final screens must stay hidden and Next must not
// let the shell advance past them.
const blocked = computed(() => !!store.category && !list.value)

const selected = computed(
  () => (list.value ?? []).find((s) => s.serviceType === store.category) ?? null,
)
const questions = computed(() =>
  selected.value
    ? visibleQuestions(selected.value.questions, store.customFields, selected.value.serviceType)
    : [],
)
const index = ref(0)
const current = computed(() => questions.value[index.value] ?? null)
const error = ref('')

watch(questions, (qs) => {
  if (index.value > qs.length) index.value = qs.length
})

const description = ref(store.description)
watch(description, (v) => {
  store.setDescription(v)
  error.value = ''
})

function requiredMessage(type: string): string {
  return type === 'picklist' || type === 'multipicklist'
    ? 'Select an option to continue'
    : 'Add an answer to continue'
}

let timer: ReturnType<typeof setTimeout> | null = null
function cancelAutoAdvance() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}
onBeforeUnmount(cancelAutoAdvance)

function answer(field: string, value: string, type: string) {
  store.setQuestion(field, value)
  error.value = ''
  cancelAutoAdvance()
  if (value && type === 'picklist') {
    timer = setTimeout(() => {
      if (current.value) next()
    }, AUTO_ADVANCE_MS)
  }
}

function next(): boolean {
  cancelAutoAdvance()
  if (blocked.value) return true
  if (current.value) {
    const q = current.value
    if (q.required && !(store.customFields[q.field] ?? '').trim()) {
      error.value = requiredMessage(q.type)
      return true
    }
    error.value = ''
    index.value += 1
    return true
  }
  if (description.value.trim().length < MIN_DESCRIPTION) {
    error.value = 'Add a description to continue'
    return true
  }
  return false
}

function back(): boolean {
  cancelAutoAdvance()
  error.value = ''
  if (blocked.value) return false
  if (index.value > 0) {
    index.value -= 1
    return true
  }
  return false
}

useWizardNav({ next, back })

function setPrivacy(e: Event) {
  store.setPrivacy((e.target as HTMLInputElement).checked)
}
</script>

<template>
  <div class="details-step">
    <template v-if="blocked">
      <p v-if="isLoading" class="details-step__status">Loading questions…</p>
      <p v-else-if="loadError" class="details-step__error" role="alert">
        {{ loadError.message || 'Could not load questions.' }}
        <PhilaButton
          variant="secondary"
          class="details-step__retry"
          data-test="retry-questions"
          @click="() => void load()"
          >Retry</PhilaButton
        >
      </p>
    </template>

    <template v-else-if="current">
      <h1 class="details-step__title">
        {{ current.label }}
        <span v-if="current.required" class="details-step__required">* (required)</span>
      </h1>
      <QuestionField
        :key="current.field"
        :question="current"
        hide-label
        :error="error"
        :model-value="store.customFields[current.field] ?? ''"
        @update:model-value="(v: string) => answer(current!.field, v, current!.type)"
      />
    </template>

    <template v-else>
      <h1 class="details-step__title">Details</h1>

      <label class="details-step__label" for="details-description">
        Describe the issue <span class="details-step__required">* (required)</span>
      </label>
      <textarea
        id="details-description"
        v-model="description"
        class="details-step__textarea"
        :class="{ 'details-step__textarea--error': !!error }"
        rows="4"
        aria-required="true"
        aria-describedby="details-description-hint"
      ></textarea>
      <p id="details-description-hint" class="details-step__hint">At least 10 characters.</p>
      <p v-if="error" class="details-step__error" role="alert">{{ error }}</p>

      <ContactInfo />

      <fieldset class="details-step__privacy">
        <legend class="details-step__privacy-legend">Visibility</legend>
        <label class="details-step__privacy-toggle">
          <input
            type="checkbox"
            :checked="store.publicVisibility"
            aria-describedby="details-privacy-note"
            @change="setPrivacy"
          />
          Make this report public
        </label>
        <p id="details-privacy-note" class="details-step__privacy-note">
          Public reports show up on the map. Off by default; only you and 311 staff see your private
          reports.
        </p>
      </fieldset>
    </template>
  </div>
</template>

<style scoped>
.details-step {
  max-width: 640px;
}
.details-step__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-m, 1rem);
}
.details-step__label {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
}
.details-step__required {
  font-weight: 400;
  color: var(--ui-color-grey-700, #4a4a4a);
  font-size: 0.875rem;
}
.details-step__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid var(--ui-color-grey-400, #a1a1a1);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
}
.details-step__hint {
  margin: 4px 0 var(--spacing-l, 2rem);
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
.details-step__error {
  margin: 4px 0 0;
  color: var(--Schemes-On-Error-Container, #992100);
  font-weight: 600;
}
.details-step__textarea--error {
  border-color: var(--Schemes-On-Error-Container, #992100);
}
.details-step__retry {
  margin-left: var(--spacing-s, 0.75rem);
}
.details-step__privacy {
  border: 1px solid var(--ui-color-grey-200, #e3e3e3);
  border-radius: 8px;
  padding: var(--spacing-m, 1rem);
  margin: var(--spacing-l, 2rem) 0 0;
}
.details-step__privacy-legend {
  font-weight: 700;
  padding: 0 4px;
}
.details-step__privacy-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.details-step__privacy-note {
  margin: var(--spacing-s, 0.75rem) 0 0;
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
</style>
