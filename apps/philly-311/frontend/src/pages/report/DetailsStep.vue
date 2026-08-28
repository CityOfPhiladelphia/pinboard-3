<!-- ABOUTME: Wizard step 4 — details: walks the issue type's questions one per
     screen (auto-advancing single-choice answers), ending with the required
     description (10-char floor), contact info, and report visibility. -->
<script setup lang="ts">
import { computed, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useServiceTypes } from '@/composables/useServiceTypes'
import { useWizardNav } from '@/composables/useWizardNav'
import { visibleQuestions } from '@/utils/conditional'
import WizardLoadError from '@/components/wizard/WizardLoadError.vue'
import DetailsStepQuestion from '@/components/wizard/DetailsStepQuestion.vue'
import DetailsStepFinal from '@/components/wizard/DetailsStepFinal.vue'

const MIN_DESCRIPTION = 10
const AUTO_ADVANCE_MS = 300

const store = useReportSubmissionStore()
const { list, load, isLoading, error: loadError } = useServiceTypes()

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
const blocked = computed(() => !!store.category && isLoading.value)

const selected = computed(() => {
  return (list.value ?? []).find((s) => s.serviceType === store.category) ?? null
})

const questions = computed(() => {
  return selected.value
    ? visibleQuestions(selected.value.questions, store.customFields, selected.value.serviceType)
    : []
})

const current = computed(() => questions.value?.[index.value] ?? null)

watch(questionResponse, () => {
  if (store.customFields[current.value.field] !== questionResponse.value)
    answer(current.value.field, questionResponse.value, current.value.type)
})

watch(questions, (qs) => {
  if (index.value > qs.length) index.value = qs.length
})

watch(description, (v) => {
  store.setDescription(v)
  error.value = ''
})

onBeforeMount(async () => {
  await load()
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
  store.setQuestion(field, value)
  error.value = ''
  cancelAutoAdvance()
  if (value && ['boolean', 'picklist'].includes(type)) {
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
  <p v-if="isLoading" class="details-step__status" v-text="'Loading questions…'" />

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
  />

  <WizardLoadError v-else :error-message="loadError?.message || 'Could not load questions.'" />
</template>

<style scoped></style>
