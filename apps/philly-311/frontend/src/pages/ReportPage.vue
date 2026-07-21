<!-- ABOUTME: Report-wizard shell. Renders a breadcrumb, the StepIndicator, the active
     child step via <router-view>, and contextual Reset/Skip/Back/Next controls.
     canAdvance is provided to children; Next is disabled while the active step reports it cannot advance. -->
<script setup lang="ts">
import { provide, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import StepIndicator from '@/components/wizard/StepIndicator.vue'
import { PhilaButton } from '@phila/phila-ui-button'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { WIZARD_CAN_ADVANCE_KEY } from '@/composables/useWizardValidity'

const router = useRouter()
const route = useRoute()
const store = useReportSubmissionStore()

const STEPS = [
  { title: 'Image', path: '/report' },
  { title: 'Issue type', path: '/report/issue-type' },
  { title: 'Location', path: '/report/location' },
  { title: 'Details', path: '/report/details' },
  { title: 'Review', path: '/report/review' },
]

const canAdvance = ref(true)
provide(WIZARD_CAN_ADVANCE_KEY, canAdvance)

const currentStep = computed(() => {
  const idx = STEPS.findIndex((s) => s.path === route.path)
  return idx === -1 ? 1 : idx + 1
})
const completedThrough = computed(() => Math.max(0, currentStep.value - 1))
const isImageStep = computed(() => currentStep.value === 1)
const isLast = computed(() => currentStep.value === STEPS.length)
const prevPath = computed(() => STEPS[currentStep.value - 2]?.path ?? null)
const nextPath = computed(() => STEPS[currentStep.value]?.path ?? null)

function goPrev() {
  if (prevPath.value) router.push(prevPath.value)
}
function goNext() {
  if (canAdvance.value && nextPath.value) router.push(nextPath.value)
}
function resetWizard() {
  store.reset()
  router.push('/report')
}
</script>

<template>
  <div class="wizard">
    <nav class="wizard__crumb" aria-label="Breadcrumb">
      <RouterLink to="/">Home</RouterLink> / <span>Report an issue</span>
    </nav>

    <StepIndicator
      :steps="STEPS"
      :current-step="currentStep"
      :completed-through="completedThrough"
      @navigate="(path: string) => router.push(path)"
    />

    <section class="wizard__content">
      <RouterView />
    </section>

    <footer class="wizard__nav">
      <button
        v-if="isImageStep"
        type="button"
        class="wizard__reset"
        data-test="wizard-reset"
        @click="resetWizard"
      >
        Reset
      </button>
      <PhilaButton
        v-else
        variant="secondary"
        data-test="wizard-back"
        :disabled="!prevPath"
        @click="goPrev"
        >Back</PhilaButton
      >

      <div class="wizard__nav-right">
        <PhilaButton v-if="isImageStep" variant="secondary" data-test="wizard-skip" @click="goNext"
          >Skip</PhilaButton
        >
        <PhilaButton
          v-if="!isLast"
          variant="primary"
          data-test="wizard-next"
          :disabled="!canAdvance || !nextPath"
          @click="goNext"
          >Next</PhilaButton
        >
      </div>
    </footer>
  </div>
</template>

<style scoped>
.wizard {
  max-width: 980px;
  margin: 0 auto;
  padding: var(--spacing-m, 1rem);
  height: 100%;
  overflow-y: auto;
}
.wizard__crumb {
  font-size: 0.875rem;
  margin-bottom: var(--spacing-s, 0.75rem);
}
.wizard__content {
  padding: var(--spacing-l, 2rem) 0;
  min-height: 320px;
}
.wizard__nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-m, 1rem);
  border-top: 1px solid var(--ui-color-grey-300, #d6d6d6);
}
.wizard__nav-right {
  display: flex;
  gap: var(--spacing-s, 0.75rem);
}
.wizard__reset {
  background: none;
  border: none;
  color: var(--ui-color-primary, #0f4d90);
  cursor: pointer;
}
</style>
