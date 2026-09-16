<!-- ABOUTME: Wizard step 5 — review the report and submit it to the API.
     Registers its Submit action into the shell's footer via useWizardSubmit,
     in place of Next, rather than rendering its own button. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@phila/sso-vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useAnonymousActivityStore } from '@/stores/anonymousActivity'
import { useApi } from '@/composables/useApi'
import { useWizardSubmit } from '@/composables/useWizardSubmit'
import ReviewSummary from '@/components/wizard/ReviewSummary.vue'
import { Callout } from '@phila/phila-ui-callout'
import type { SubmitResponse } from '@/types/wizard'
import ReportStep from '@/components/wizard/ReportStep.vue'

const GENERIC_ERROR = 'Something went wrong submitting your report. Please try again.'
const router = useRouter()
const store = useReportSubmissionStore()
const auth = useAuth()
const anonymousActivity = useAnonymousActivityStore()

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
  store.recordSubmission(result)
  // The API can't tell an anonymous submitter's own report apart from anyone
  // else's later (no account to check against), so upvoting it 400s server-side
  // unless this browser remembers submitting it — same reason upvotes themselves
  // need anonymousActivity tracking.
  if (!auth.isAuthenticated.value) anonymousActivity.markSubmitted(result.id)
  router.push('/report/confirmation')
}

useWizardSubmit(
  computed(() => ({
    label: submitting.value ? 'Submitting…' : 'Submit report',
    disabled: !canSubmit.value,
    onSubmit: submit,
  })),
)
</script>

<template>
  <ReportStep
    :required="true"
    :error-active="false"
    :hide-required="true"
    :step-title="'Review your report'"
  >
    <template #step-content>
      <div class="review-step">
        <p class="review-step__intro">Check your report before submitting.</p>

        <ReviewSummary />

        <Callout
          v-if="errorMessage"
          class="review-step__error"
          type="error"
          role="alert"
          :message="errorMessage"
        />
      </div>
    </template>
  </ReportStep>
</template>

<style scoped>
.review-step {
  max-width: 640px;
  overflow: auto;
}

.review-step__intro {
  margin: 0 0 var(--spacing-m, 1rem);
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
}

.review-step__error {
  margin: var(--spacing-m, 1rem) 0;
}
</style>
