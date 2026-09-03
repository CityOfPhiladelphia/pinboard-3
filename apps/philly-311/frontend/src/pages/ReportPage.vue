<!-- ABOUTME: Report-wizard shell. Renders a breadcrumb, the StepIndicator, the active
     child step via <router-view>, and contextual Exit/Skip/Back/Next controls.
     Next always stays enabled; canAdvance and showErrors are provided so an
     invalid attempt surfaces the active step's error messages instead of
     blocking the click. A step can register nav handlers to intercept
     Back/Next before the shell changes routes. Exit opens ExitDialog, which
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

const STEPS = [
  { title: 'Image', path: '/report' },
  { title: 'Issue type', path: '/report/issue-type' },
  { title: 'Location', path: '/report/location' },
  { title: 'Details', path: '/report/details' },
  { title: 'Review', path: '/report/review' },
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

provide(WIZARD_CAN_ADVANCE_KEY, canAdvance)
provide(WIZARD_SHOW_ERRORS_KEY, showErrors)
provide(WIZARD_NAV_KEY, navHandlers)

watch(
  // The wizard is its own scroll container (the shell locks the viewport), so
  // the browser never resets scroll on navigation — do it on each step change.
  () => route.path,
  () => {
    if (wizardEl.value) wizardEl.value.scrollTop = 0
  },
)

watch(
  exitOpen,
  (isOpen, wasOpen) => {
    if (isOpen) {
      router.push(`?${store.stateToUrlQueryParams()}`)
    } else if (!isOpen && wasOpen) {
      router.back()
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
const completedThrough = computed(() => currentStep.value - 1)
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
  store.reset()
  router.push('/')
}
</script>

<template>
  <div ref="wizardEl" class="wizard">
    <StepIndicator
      :steps="STEPS"
      :current-step="currentStep"
      :completed-through="completedThrough"
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
          v-if="!isLast"
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
  display: grid;
  grid-template-columns:
    [full-start] var(--scale-800, 4rem)
    [wizard-start] 1fr
    [steps-start] auto [steps-end]
    1fr [wizard-end]
    var(--scale-800, 4rem) [full-end];
  grid-template-rows:
    var(--spacing-l, 1.5rem)
    [steps-row] auto
    var(--spacing-l, 1.5rem)
    [wizard-row] 1fr
    var(--spacing-l, 1.5rem)
    [footer-border] 0
    var(--spacing-m, 1rem)
    [wizard-footer] auto
    var(--spacing-m, 1rem);
  height: 100%;
  width: 100%;
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
  column-gap: var(--spacing-m, 1rem);
}

.wizard__exit {
  text-decoration: underline;
}
</style>
