<!-- ABOUTME: Wizard step indicator with click-to-jump on completed steps.
     Marks the current step with aria-current="step" and labels via SR-only text. -->
<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@phila/phila-ui-core'
import { IconCheck } from '@phila/phila-ui-core/icons'

export interface Step {
  label: string
  path: string
}

interface IndexedStep extends Step {
  number: number
  state: 'done' | 'current' | 'upcoming'
}

const props = withDefaults(
  defineProps<{
    steps: Step[]
    componentAriaLabel: string
    currentStep?: number
  }>(),
  {
    currentStep: 1,
  },
)

const emit = defineEmits<{ navigate: [path: string] }>()

const currentStepSafe = computed(() => {
  const currentStepisValid = isValidStepNumber(props.currentStep, props.steps)
  if (!currentStepisValid)
    console.warn(`${props.currentStep} is not a positive interger greater than 0. Defaulting to 1.`)
  return currentStepisValid ? props.currentStep : 1
})

const gridWidths = computed(() => {
  if (props.steps.length < 2)
    throw new Error(`Number of steps must be at least 2. Got array of length ${props.steps.length}`)
  let widths = '2fr'
  let n = props.steps.length - 2
  while (n--) widths += ' 3fr'
  return { 'grid-template-columns': widths.concat(' 2fr') }
})

const indexed = computed<IndexedStep[]>(() => {
  return props.steps.map((step, i) => {
    const stepNumber = i + 1
    return {
      ...step,
      number: stepNumber,
      state:
        stepNumber < currentStepSafe.value
          ? 'done'
          : stepNumber > currentStepSafe.value
            ? 'upcoming'
            : 'current',
    }
  })
})

function ariaLabelForStep(stepNumber: number, totalSteps: number) {
  return `Step ${stepNumber} of ${totalSteps}`
}

function isValidStepNumber(num: number, steps: Step[]) {
  return num > 0 && num <= steps.length && Number.isInteger(num)
}
</script>

<template>
  <nav :aria-label="componentAriaLabel" class="step-indicator">
    <ol class="steps" :style="gridWidths">
      <li
        v-for="step in indexed"
        :key="step.number"
        class="step"
        :data-state="step.state"
        :aria-label="ariaLabelForStep(step.number, steps.length)"
      >
        <div class="step-dash-left" />
        <div class="step-pad-left" />

        <span
          v-if="step.number >= currentStepSafe"
          class="step-number has-text-label-small"
          v-text="step.number"
        />
        <button v-else class="step-button" @click="emit('navigate', step.path)">
          <Icon :icon="IconCheck" size="extra-small" class="step-number" />
        </button>
        <span
          v-if="step.number >= currentStepSafe"
          :class="[
            'step-label',
            step.number === currentStepSafe ? 'has-text-label-small' : 'has-text-body-extra-small',
          ]"
          v-text="step.label"
        />
        <button
          v-else
          class="step-label has-text-body-extra-small"
          @click="emit('navigate', step.path)"
          v-text="step.label"
        />

        <div class="step-pad-right" />
        <div class="step-dash-right" />
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.steps {
  display: grid;
  padding: 0;
  margin: 0;
}

.step {
  display: grid;
  grid-row: 1 / 3;
  grid-template-areas:
    'dash_l pad_l number pad_r dash_r'
    'label label label label label';
  grid-template-columns: 1fr auto auto auto 1fr;
  grid-template-rows: subgrid;
  row-gap: var(--spacing-xs, 0.5rem);
  align-items: center;
  padding: 0;
  margin: 0;
}

.step:first-child {
  grid-template-columns: 0 0 auto auto 1fr;
  .step-dash-left {
    border: none;
  }
}

.step:last-child {
  grid-template-columns: 1fr auto auto 0 0;
  .step-dash-right {
    border: none;
  }
}

.step-label:focus-visible,
.step:has(.step-button:hover, .step-button:focus-visible) > .step-label {
  text-decoration: underline;
}

/* Gap between step indicator and lines */
.step-pad-right {
  grid-area: pad_r;
}

.step-pad-left {
  grid-area: pad_l;
}

.step-pad-right,
.step-pad-left {
  width: var(--spacing-xs, 0.5rem);
}

/* Connecting line between steps */
.step-dash-right {
  grid-area: dash_r;
}

.step-dash-left {
  grid-area: dash_l;
}

.step-dash-right,
.step-dash-left {
  height: 0px;
  border: var(--border-width-s, 0.0625rem) solid var(--Schemes-Border-low, rgb(204, 204, 204));
}

.step-button {
  background: transparent;
  border: none;
}

.step-number {
  grid-area: number;
  display: grid;
  place-content: center;
  margin: 0;
  width: var(--scale-400, 2rem);
  height: var(--scale-400, 2rem);
  aspect-ratio: 1/1;
  background: transparent;
  border-radius: var(--border-radius-2xl, 2rem);
}

.step-indicator .step:first-child .step-number,
.step-indicator .step:first-child .step-label {
  margin-inline-start: 0;
}

.step-indicator .step:last-child .step-number,
.step-indicator .step:last-child .step-label {
  margin-inline-end: 0;
}

.step-label {
  grid-area: label;
  display: grid;
  margin-inline: auto;
  background: transparent;
  border: none;
}

/* Done: clickable button styling */
.step-indicator .step[data-state='done'] .step-number {
  width: 1.7rem;
  height: 1.7rem;
  border: var(--border-width-m, 0.125rem) solid var(--Schemes-Primary, rgb(16, 52, 244));
  color: var(--Schemes-Primary, rgb(16, 52, 244));
}

.step-indicator .step[data-state='done'] .step-label:hover,
.step-indicator .step[data-state='done'] .step-button:hover {
  cursor: pointer;
  text-decoration: underline;
}

.step-indicator
  .step[data-state='done']
  :where(.step-button:focus-visible, .step-label:focus-visible) {
  outline-color: var(--Schemes-Primary, rgb(16, 52, 244));
  outline-offset: var(--spacing-2xs);
}

.step-indicator .step[data-state='done'] .step-dash-right,
.step-indicator .step[data-state='done'] .step-dash-left,
.step-indicator .step[data-state='current'] .step-dash-left {
  border: var(--border-width-s, 0.0625rem) solid var(--Schemes-Primary, rgb(16, 52, 244));
}

/* Current: filled primary circle with number */
.step-indicator .step[data-state='current'] .step-number {
  background: var(--Schemes-Primary, rgb(16, 52, 244));
  color: var(--Schemes-On-Primary, #fff);
}

.step-indicator .step[data-state='current'] .step-label,
.step-indicator .step[data-state='upcoming'] .step-label {
  color: var(--Schemes-On-Background, #000);
}

/* Upcoming: outlined circle with number */
.step-indicator .step[data-state='upcoming'] .step-number {
  border: var(--border-width-m, 0.125rem) dashed var(--Schemes-Border-low, rgb(204, 204, 204));
  color: var(--Schemes-Border-high, rgb(155, 155, 155));
}
</style>
