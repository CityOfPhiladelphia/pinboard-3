<!-- ABOUTME: Wizard step indicator with click-to-jump on completed steps.
     Marks the current step with aria-current="step" and labels via SR-only text. -->
<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@phila/phila-ui-core'
import { IconCheck } from '@phila/phila-ui-core/icons'

interface Step {
  title: string
  path: string
}
const props = defineProps<{
  steps: Step[]
  currentStep: number
  completedThrough: number
}>()
const emit = defineEmits<{ navigate: [path: string] }>()

const indexed = computed(() =>
  props.steps.map((s, i) => ({
    ...s,
    n: i + 1,
    state:
      i + 1 < props.currentStep ? 'done' : i + 1 === props.currentStep ? 'current' : 'upcoming',
    clickable: i + 1 <= props.completedThrough && i + 1 !== props.currentStep,
  })),
)
</script>

<template>
  <nav aria-label="Report progress" class="step-indicator">
    <ol>
      <li v-for="step in indexed" :key="step.n" :data-state="step.state">
        <span class="sr-only" :v-text="`Step ${step.n} of ${steps.length}`" />
        <div
          :type="step.clickable ? 'button' : ''"
          class="step-status"
          @click="step.clickable ? emit('navigate', step.path) : null"
        >
          <span v-if="step.n >= currentStep" class="step-number" v-text="step.n" />
          <Icon v-else :icon="IconCheck" size="extra-small" class="step-number" />
          <span class="step-label" v-text="step.title" />
        </div>
        <div v-if="step.n < steps.length" class="step-dash" />
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.step-indicator ol {
  counter-reset: step-counter;
  display: grid;
  place-content: center;
  list-style: none;
  padding: 0;
  margin: 0;
  max-width: 512px;
  grid-template-columns: 2fr 2fr 2fr 2fr 1fr;
}

.step-indicator li {
  counter-increment: step-counter;
  display: grid;
  grid-template-areas:
    'number dash'
    'label empty';
}

/* Connecting line between steps */
.step-dash {
  grid-area: dash;
  content: '';
  height: 0px;
  border: var(--border-width-s, 1px) solid var(--Schemes-Border-low, #ccc);
  margin: var(--spacing-m, 0.5rem) 0;
  width: 72px;
}

/* Base style for both button and span step labels */
.step-indicator li span:not(.sr-only) {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.5rem);
  font-size: 0.875rem;
  white-space: nowrap;
}

.step-number {
  grid-area: number;
  display: grid;
  place-content: center;
  margin: 0 auto var(--spacing-xs, 8px) auto;
  width: 32px;
  height: 32px;
  aspect-ratio: 1/1;
  background: transparent;
  border-radius: var(--border-radius-2xl, 32px);
  font-family: var(--Label-Small-font-label-small-family, Montserrat);
  font-size: var(--Label-Small-font-label-small-size, 14px);
  font-style: normal;
  line-height: var(--Label-Small-font-label-small-lineheight, 20px); /* 142.857% */
  font-weight: 600;
}

.step-indicator li:first-child .step-number {
  margin-left: 0;
}

.step-indicator li:last-child .step-number {
  margin-right: 0;
}

.step-label {
  grid-area: label;
  font-family: var(--Body-ExtraSmall-font-body-xs-family, Montserrat);
  font-size: var(--Body-ExtraSmall-font-body-xs-size, 12px);
  font-style: normal;
  line-height: var(--Body-ExtraSmall-font-body-xs-lineheight, 16px); /* 133.333% */
  font-weight: 400;
  text-align: center;
}

/* Done: clickable button styling */
.step-indicator li[data-state='done'] .step-status {
  cursor: pointer;
}

.step-indicator li[data-state='done'] .step-number {
  width: 28px;
  height: 28px;
  border: var(--border-width-m, 2px) solid var(--Schemes-Primary, #1034f4);
  color: var(--Schemes-Primary, #1034f4);
}

.step-indicator li[data-state='done']:hover {
  text-decoration: underline;
}

.step-indicator li[data-state='done']::after {
  pointer-events: unset;
  cursor: default;
}

/* Current: filled primary circle with number */
.step-indicator li[data-state='current'] .step-number {
  background: var(--Schemes-Primary, #0f4d90);
  color: var(--Schemes-On-Primary, #fff);
}

.step-indicator li[data-state='current'] .step-label {
  color: var(--Schemes-On-Background, #000);
  font-weight: 600;
}

/* Upcoming: outlined circle with number */
.step-indicator li[data-state='upcoming'] .step-number {
  border: var(--border-width-m, 2px) dashed var(--Schemes-Border-low, #ccc);
  color: var(--Schemes-Border-high, #9b9b9b);
}

.step-indicator li[data-state='upcoming'] .step-label {
  color: var(--Schemes-On-Background, #000);
}

/* Responsive: stack vertically on small screens */
@media (max-width: 600px) {
  .step-indicator ol {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-m, 1rem);
  }

  .step-indicator li {
    flex: none;
    width: 100%;
  }

  .step-indicator li:not(:last-child)::after {
    display: none;
  }
}
</style>
