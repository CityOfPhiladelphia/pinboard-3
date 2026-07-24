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

const router = useRouter()
const route = useRoute()
const store = useReportSubmissionStore()
const myCases = useMyCasesStore()
const exitOpen = ref(false)

const STEPS = [
  { title: 'Image', path: '/report' },
  { title: 'Issue type', path: '/report/issue-type' },
  { title: 'Location', path: '/report/location' },
  { title: 'Details', path: '/report/details' },
  { title: 'Review', path: '/report/review' },
]

// The wizard is its own scroll container (the shell locks the viewport), so
// the browser never resets scroll on navigation — do it on each step change.
const wizardEl = ref<HTMLElement | null>(null)
watch(
  () => route.path,
  () => {
    if (wizardEl.value) wizardEl.value.scrollTop = 0
  },
)

const canAdvance = ref(true)
const showErrors = ref(false)
const navHandlers = ref<WizardNavHandlers | null>(null)
provide(WIZARD_CAN_ADVANCE_KEY, canAdvance)
provide(WIZARD_SHOW_ERRORS_KEY, showErrors)
provide(WIZARD_NAV_KEY, navHandlers)

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
  if (navHandlers.value?.back()) return
  if (prevPath.value) router.push(prevPath.value)
}
function goNext() {
  if (navHandlers.value?.next()) return
  if (!canAdvance.value) {
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
      <button type="button" class="wizard__exit" data-test="wizard-exit" @click="exitOpen = true">
        Exit
      </button>

      <div class="wizard__nav-right">
        <PhilaButton v-if="isImageStep" variant="secondary" data-test="wizard-skip" @click="goNext"
          >Skip</PhilaButton
        >
        <PhilaButton
          v-if="!isImageStep"
          variant="secondary"
          data-test="wizard-back"
          :disabled="!prevPath"
          @click="goPrev"
          >Back</PhilaButton
        >
        <PhilaButton
          v-if="!isLast"
          variant="primary"
          data-test="wizard-next"
          :disabled="!nextPath"
          @click="goNext"
          >Next</PhilaButton
        >
      </div>
    </footer>

    <ExitDialog v-model:open="exitOpen" @save="saveAndExit" @discard="discardAndExit" />
  </div>
</template>

<style scoped>
.wizard {
  max-width: 980px;
  margin: 0 auto;
  /* No bottom padding: the sticky nav pins to the scrollport's bottom edge and
     content would otherwise show through a padding-sized gap beneath it. */
  padding: var(--spacing-m, 1rem) var(--spacing-m, 1rem) 0;
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
/* Sticky so Exit/Back/Next stay reachable: the wizard scrolls internally
   (the shell locks the viewport) and steps like Location put a wheel-capturing
   map over most of the content, so controls at the end of the scroll run
   can otherwise sit below the fold with no way to reach them. */
.wizard__nav {
  position: sticky;
  bottom: 0;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-m, 1rem) 0;
  border-top: 1px solid var(--ui-color-grey-300, #d6d6d6);
}
.wizard__nav-right {
  display: flex;
  gap: var(--spacing-s, 0.75rem);
}
.wizard__exit {
  background: none;
  border: none;
  color: var(--ui-color-primary, #0f4d90);
  cursor: pointer;
}
</style>
