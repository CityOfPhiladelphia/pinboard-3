<!-- ABOUTME: Wizard step 4 — details: walks the issue type's questions one per
     screen (auto-advancing single-choice answers), ending with the required
     description (10-char floor), contact info, and report visibility. -->
<script setup lang="ts">
import { computed, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useServiceTypes } from '@/composables/useServiceTypes'
import { useWizardNav } from '@/composables/useWizardNav'
import { visibleQuestions } from '@/utils/conditional'
import { PhilaButton } from '@phila/phila-ui-button'
import DetailsStepQuestion from '@/components/wizard/DetailsStepQuestion.vue'
import DetailsStepFinal from '@/components/wizard/DetailsStepFinal.vue'

const MIN_DESCRIPTION = 10
const AUTO_ADVANCE_MS = 300

const store = useReportSubmissionStore()
const { list, load, isLoading, error: loadError } = useServiceTypes()

const restoringState = ref(true)
const error = ref('')
const description = ref(store.description)
const index = ref(
  Object.keys(store.customFields).length ? Object.keys(store.customFields).length - 1 : 0,
)
const questionResponse = ref('')
// A deep link (?category=X) can land here before the catalog has loaded, or
// after it's failed to load — in both cases the category's questions are
// unknown, so question/final screens must stay hidden and Next must not
// let the shell advance past them.
const blocked = computed(() => !!store.category && !list.value)

const selected = computed(() => {
  return (list.value ?? []).find((s) => s.serviceType === store.category) ?? null
})

const questions = computed(() => {
  return selected.value
    ? visibleQuestions(selected.value.questions, store.customFields, selected.value.serviceType)
    : []
})

const current = computed(() => {
  return questions.value?.[index.value] ?? null
})

// watch(current, () => console.log(current.value.type))

watch(questionResponse, () =>
  answer(current.value.field, questionResponse.value, current.value.type),
)

watch(questions, (qs) => {
  if (index.value > qs.length) index.value = qs.length
})

watch(description, (v) => {
  store.setDescription(v)
  error.value = ''
})

onBeforeMount(async () => {
  await load()
  console.log(
    list.value.filter((item) => item.questions.some((question) => question.type === 'textarea')),
  )
  console.log(
    new Set(
      Array.from(list.value, (item) =>
        Array.from(item.questions, (question) => question.type),
      ).flat(),
    ),
  )
  questionResponse.value = store.customFields[current.value.field] ?? ''
})

onBeforeUnmount(cancelAutoAdvance)

let timer: ReturnType<typeof setTimeout> | null = null
function cancelAutoAdvance() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

function requiredMessage(type: string): string {
  return type === 'picklist' || type === 'multipicklist'
    ? 'Select an option to continue'
    : 'Add an answer to continue'
}

function answer(field: string, value: string, type: string) {
  if (restoringState.value) {
    // ensure that if an in-progress report is being restored, the page remains on the last question with a response
    restoringState.value = false
    return
  }
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
</script>

<template>
  <template v-if="isLoading">
    <p class="details-step__status">Loading questions…</p>
  </template>

  <DetailsStepQuestion
    v-else-if="current"
    v-model:response="questionResponse"
    v-model:error="error"
    :current="current"
  />

  <DetailsStepFinal
    v-else-if="questions.length == index"
    v-model:description="description"
    v-model:error="error"
  ></DetailsStepFinal>

  <template v-else>
    <p class="details-step__error" role="alert">
      {{ loadError?.message || 'Could not load questions.' }}
      <PhilaButton
        variant="secondary"
        class="details-step__retry"
        data-test="retry-questions"
        @click="() => void load()"
        >Retry</PhilaButton
      >
    </p>
  </template>
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
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
  font-size: 0.875rem;
}
.details-step__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid var(--Schemes-Border, #a1a1a1);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
}
.details-step__hint {
  margin: 4px 0 var(--spacing-l, 2rem);
  font-size: 0.875rem;
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
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
  border: 1px solid var(--Schemes-Border-low, #e3e3e3);
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
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
}
</style>
