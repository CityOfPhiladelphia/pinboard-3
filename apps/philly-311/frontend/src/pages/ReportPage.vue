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
import { Breadcrumbs } from '@phila/phila-ui-breadcrumbs'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useMyCasesStore } from '@/stores/myCases'
import { WIZARD_CAN_ADVANCE_KEY, WIZARD_SHOW_ERRORS_KEY } from '@/composables/useWizardValidity'
import { WIZARD_NAV_KEY, type WizardNavHandlers } from '@/composables/useWizardNav'

const router = useRouter()
const route = useRoute()
const store = useReportSubmissionStore()
const myCases = useMyCasesStore()

const exitOpen = ref(false)
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
    <div class="wizard__header">
      <Breadcrumbs :items="[{ label: 'Report an issue' }]" class="wizard__bradcrumbs" />

      <StepIndicator
        :steps="STEPS"
        :current-step="currentStep"
        :completed-through="completedThrough"
        class="wizard__steps"
        @navigate="(path: string) => router.push(path)"
      />
    </div>
    <div class="wizard__content">
      <RouterView />
    </div>
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
  grid-template-areas:
    'w_header'
    'w_content'
    'w_footer';
  grid-template-rows: 9rem 1fr 7rem;
  row-gap: var(--spacing-s, 0.75rem);
  height: 100%;
  width: 100%;
  margin: 0 auto;
}

.wizard__header {
  grid-area: w_header;
  grid-template-areas:
    'w_breadcrumbs'
    'w_stepindicator';
  grid-template-rows: 3fr 5fr;
  width: 100%;
  padding: var(--spacing-l, 1.5rem) var(--spacing-xl, 2rem);
}

.wizard__bradcrumbs {
  grid-area: w_breadcrumbs;
  padding: var(--spacing-xs, 0.5rem);
}

.wizard__bradcrumbs :deep(li) {
  margin-bottom: 0;
  padding-left: 0;
}

.wizard__steps {
  grid-area: w_stepindicator;
  display: grid;
  place-content: center;
}

.wizard__content {
  grid-area: w_content;
  margin: 0 var(--scale-1000, 5rem);
  overflow: hidden;
}

/* Sticky so Exit/Back/Next stay reachable: the wizard scrolls internally
   (the shell locks the viewport) and steps like Location put a wheel-capturing
   map over most of the content, so controls at the end of the scroll run
   can otherwise sit below the fold with no way to reach them. */
.wizard__nav {
  grid-area: w_footer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-m, 1rem) 0;
  border-top: 1px solid var(--Schemes-Border-low, #d6d6d6);
  background: var(--Schemes-Background, #fff);
}

.wizard__nav-right {
  display: flex;
  gap: var(--spacing-s, 0.75rem);
  margin-right: var(--scale-1000, 5rem);
}

.wizard__exit {
  margin-left: var(--scale-1000, 5rem);
  text-decoration: underline;
}
</style>
