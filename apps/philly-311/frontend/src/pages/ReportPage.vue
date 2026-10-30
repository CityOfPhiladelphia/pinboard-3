<!-- ABOUTME: Report-wizard shell. Renders a breadcrumb, the StepIndicator, the active
     child step via <router-view>, and contextual Exit/Skip/Back/Next controls.
     Next always stays enabled; canAdvance and showErrors are provided so an
     invalid attempt surfaces the active step's error messages instead of
     blocking the click. A step can register nav handlers to intercept
     Back/Next before the shell changes routes, or (on the last step) a
     Submit action that replaces Next entirely. Exit opens ExitDialog, which
     either saves the in-progress report as a draft or discards it. -->
<script setup lang="ts">
import { provide, ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import StepIndicator from '@/components/wizard/StepIndicator.vue'
import ExitDialog from '@/components/wizard/ExitDialog.vue'
import { PhilaButton } from '@phila/phila-ui-button'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useMyCasesStore } from '@/stores/myCases'
import { WIZARD_CAN_ADVANCE_KEY, WIZARD_SHOW_ERRORS_KEY } from '@/composables/useWizardValidity'
import { WIZARD_NAV_KEY, type WizardNavHandlers } from '@/composables/useWizardNav'
import { WIZARD_SUBMIT_KEY, type WizardSubmitHandler } from '@/composables/useWizardSubmit'
import type { Step } from '@/components/wizard/StepIndicator.vue'

const ariaLabelStepIndicator = 'Report progress'

const STEPS: Step[] = [
  { label: 'Image', path: '/report' },
  { label: 'Issue type', path: '/report/issue-type' },
  { label: 'Location', path: '/report/location' },
  { label: 'Details', path: '/report/details' },
  { label: 'Review', path: '/report/review' },
]

const router = useRouter()
const route = useRoute()
const store = useReportSubmissionStore()
const myCases = useMyCasesStore()
const exitOpen = ref(false)
const wizardEl = ref<HTMLElement | null>(null)
const canAdvance = ref(true)
const showErrors = ref(false)
const navHandlers = ref<WizardNavHandlers | null>(null)
const submitHandler = ref<WizardSubmitHandler | null>(null)

provide(WIZARD_CAN_ADVANCE_KEY, canAdvance)
provide(WIZARD_SHOW_ERRORS_KEY, showErrors)
provide(WIZARD_NAV_KEY, navHandlers)
provide(WIZARD_SUBMIT_KEY, submitHandler)

watch(
  // The wizard is its own scroll container (the shell locks the viewport), so
  // the browser never resets scroll on navigation — do it on each step change.
  () => route.path,
  () => {
    if (wizardEl.value) wizardEl.value.scrollTop = 0
  },
)

let exiting = false

watch(
  exitOpen,
  (isOpen, wasOpen) => {
    if (isOpen) {
      router.push(`?${store.stateToUrlQueryParams()}`)
    } else if (!isOpen && wasOpen) {
      if (!exiting) router.back()
    } else {
      router.replace({ query: {} })
    }
  },
  { immediate: true },
)

const currentStep = computed(() => {
  const idx = STEPS.findIndex((s) => s.path === route.path)
  return idx === -1 ? 1 : idx + 1
})
const isImageStep = computed(() => currentStep.value === 1)
const isLast = computed(() => currentStep.value === STEPS.length)
const prevPath = computed(() => STEPS[currentStep.value - 2]?.path ?? null)
const nextPath = computed(() => STEPS[currentStep.value]?.path ?? null)

function goPrev() {
  if (navHandlers.value?.back()) return
  if (prevPath.value) router.push(prevPath.value)
}

function goNext() {
  if (navHandlers.value?.next()) return
  if (!canAdvance.value && !isImageStep.value) {
    showErrors.value = true
    return
  }
  if (nextPath.value) router.push(nextPath.value)
}

function saveAndExit() {
  exiting = true
  const { category, customFields, location, description, contact, publicVisibility, photo } = store
  myCases.saveDraft({
    category,
    customFields: { ...customFields },
    location,
    description,
    contact: { ...contact },
    publicVisibility,
    ...(photo?.mediaUrl ? { mediaUrl: photo.mediaUrl } : {}),
  })
  store.reset()
  router.push('/')
}

function discardAndExit() {
  exiting = true
  store.reset()
  router.push('/')
}
</script>

<template>
  <div ref="wizardEl" class="wizard">
    <StepIndicator
      :steps="STEPS"
      :current-step="currentStep"
      :component-aria-label="ariaLabelStepIndicator"
      class="wizard__steps"
      @navigate="(path: string) => router.push(path)"
    />
    <div class="wizard__content">
      <RouterView />
    </div>
    <span class="wizard__nav-border" />
    <footer class="wizard__nav">
      <PhilaButton
        size="extra-small"
        class="wizard__exit"
        data-test="wizard-exit"
        @click="exitOpen = true"
      >
        Exit
      </PhilaButton>

      <div class="wizard__nav-right">
        <PhilaButton
          v-if="!isImageStep"
          variant="secondary"
          data-test="wizard-back"
          :disabled="!prevPath"
          @click="goPrev"
        >
          Back
        </PhilaButton>
        <PhilaButton
          v-if="isLast"
          variant="primary"
          data-test="wizard-submit"
          :disabled="!submitHandler || submitHandler.disabled"
          @click="submitHandler?.onSubmit()"
        >
          {{ submitHandler?.label ?? 'Submit report' }}
        </PhilaButton>
        <PhilaButton
          v-else
          variant="primary"
          data-test="wizard-next"
          :disabled="!nextPath"
          @click="goNext"
          >{{ isImageStep && !canAdvance ? 'Skip' : 'Next' }}
        </PhilaButton>
      </div>
    </footer>

    <ExitDialog v-model:open="exitOpen" @save="saveAndExit" @discard="discardAndExit" />
  </div>
</template>

<style scoped>
.wizard {
  /* Set bounds for reactive padding on the sides of the Report Page */
  --min-spacing: var(--spacing-m, 1rem);
  --std-side-padding: 5dvw;
  --max-side-padding: min(var(--std-side-padding), var(--scale-800, 4rem));
  --min-side-padding: max(var(--std-side-padding), var(--min-spacing));
  --side-padding: clamp(var(--min-side-padding), var(--std-side-padding), var(--max-side-padding));
  /* Set bounds for reactive row gap on the sides of the Report Page */
  --row-gap: clamp(var(--min-spacing), calc(0.3 * var(--side-padding)), var(--spacing-l, 1.5rem));
  display: grid;
  grid-template-columns:
    [full-start] var(--side-padding) [wizard-start]
    1fr
    [steps-start] min(32rem, calc(100dvw - 2 * var(--side-padding))) [steps-end]
    1fr
    [wizard-end] var(--side-padding) [full-end];
  grid-template-rows:
    var(--row-gap)
    [steps-row] auto
    var(--row-gap)
    [wizard-row] 1fr
    var(--row-gap)
    [footer-border] 0
    var(--min-spacing)
    [wizard-footer] auto
    calc(var(--min-spacing) + env(safe-area-inset-bottom, 0px));
  height: 100%;
  width: 100dvw;
}

.wizard__steps {
  grid-column: steps;
  grid-row: steps-row;
  place-content: center;
}

.wizard__content {
  grid-column: wizard;
  grid-row: wizard-row;
  place-content: center;
  overflow: hidden;
}

.wizard__nav-border {
  grid-column: full;
  grid-row: footer-border;
  border-top: 1px solid var(--Schemes-Border-low, #ccc);
}

.wizard__nav {
  grid-column: wizard;
  grid-row: wizard-footer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.wizard__nav-right {
  display: flex;
  column-gap: clamp(var(--spacing-s, 0.75rem), 2dvw, var(--spacing-m, 1rem));
}

.wizard__exit {
  text-decoration: underline;
}
</style>
