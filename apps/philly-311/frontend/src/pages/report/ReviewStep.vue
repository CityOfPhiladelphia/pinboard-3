<!-- ABOUTME: Wizard step 5 — review the report and submit it to the API.
     Owns the Submit button; the shell hides Next on the last step. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useApi } from '@/composables/useApi'
import ReviewSummary from '@/components/wizard/ReviewSummary.vue'
import { PhilaButton } from '@phila/phila-ui-button'
import { Callout } from '@phila/phila-ui-callout'
import type { SubmitResponse } from '@/types/wizard'

const GENERIC_ERROR = 'Something went wrong submitting your report. Please try again.'

const router = useRouter()
const store = useReportSubmissionStore()

// Created at setup — useApi → useAuth() → inject() is setup-scoped. The body
// is assigned per submit; fetchData reads opts.body when called.
const submitOpts = { url: '/private/key/submit', method: 'POST', body: undefined as unknown }
const { fetchData, error: submitError, isLoading: submitting } = useApi<SubmitResponse>(submitOpts)

const errorMessage = ref<string | null>(null)
const canSubmit = computed(
  () => !!store.category && !!store.location && !!store.description && !submitting.value,
)

async function submit() {
  if (submitting.value) return
  errorMessage.value = null
  try {
    submitOpts.body = store.payload()
  } catch (e) {
    errorMessage.value = (e as Error).message || GENERIC_ERROR
    return
  }
  const result = await fetchData()
  if (!result) {
    errorMessage.value = submitError.value?.message || GENERIC_ERROR
    return
  }
  store.recordSubmission({ id: result.id, caseNumber: result.caseNumber })
  router.push('/report/confirmation')
}
</script>

<template>
  <div class="review-step">
    <h1 class="review-step__title">Review</h1>
    <p class="review-step__intro">Check your report before submitting.</p>

    <ReviewSummary />

    <Callout
      v-if="errorMessage"
      class="review-step__error"
      type="error"
      role="alert"
      :message="errorMessage"
    />

    <PhilaButton
      type="button"
      class="review-step__submit"
      data-test="review-submit"
      :disabled="!canSubmit"
      @click="submit"
    >
      {{ submitting ? 'Submitting…' : 'Submit report' }}
    </PhilaButton>
  </div>
</template>

<style scoped>
.review-step {
  max-width: 640px;
}
.review-step__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-s, 0.75rem);
}
.review-step__intro {
  margin: 0 0 var(--spacing-m, 1rem);
  color: var(--ui-color-grey-700, #4a4a4a);
}
.review-step__error {
  margin: var(--spacing-m, 1rem) 0;
}
.review-step__submit {
  margin-top: var(--spacing-m, 1rem);
}
</style>
