<!-- ABOUTME: Wizard step indicator with click-to-jump on completed steps.
     Marks the current step with aria-current="step" and labels via SR-only text. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
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
const hovered = ref<Record<string, 'underline' | ''>>(
  Object.fromEntries(props.steps.map((step) => [step.title, ''])),
)

const indexed = computed(() => {
  return props.steps.map((s, i) => ({
    ...s,
    n: i + 1,
    state:
      i + 1 < props.currentStep ? 'done' : i + 1 === props.currentStep ? 'current' : 'upcoming',
    clickable: i + 1 <= props.completedThrough && i + 1 !== props.currentStep,
  }))
})

function handleMouseEnter(ev: MouseEvent) {
  const target = ev.target as HTMLElement
  const buttonId = target.id
  hovered.value[buttonId] = 'underline'
}
function handleMouseLeave(ev: MouseEvent) {
  const target = ev.target as HTMLElement
  const buttonId = target.id
  hovered.value[buttonId] = ''
}
</script>

<template>
  <nav aria-label="Report progress" class="step-indicator">
    <ol>
      <li v-for="step in indexed" :key="step.n" :data-state="step.state">
        <div v-if="step.n > 1" class="step-dash-left" />
        <div v-if="step.n > 1" class="step-pad-left" />

        <span v-if="step.n >= currentStep" class="step-number" v-text="step.n" />
        <div
          v-else
          :id="step.title"
          :type="step.clickable ? 'button' : ''"
          class="step-button"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
          @click="step.clickable ? emit('navigate', step.path) : null"
        >
          <Icon :icon="IconCheck" size="extra-small" class="step-number" />
        </div>

        <span class="sr-only" :v-text="`Step ${step.n} of ${steps.length}`" />
        <span
          :type="step.clickable ? 'button' : ''"
          class="step-label"
          :style="{ 'text-decoration': hovered[step.title] }"
          @click="step.clickable ? emit('navigate', step.path) : null"
          v-text="step.title"
        />

        <div v-if="step.n < steps.length" class="step-pad-right" />
        <div v-if="step.n < steps.length" class="step-dash-right" />
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
  max-width: 32rem;
  grid-template-columns: 14fr 15fr 15fr 15fr 5fr;
}

.step-indicator li {
  counter-increment: step-counter;
  margin-bottom: 0;
  padding-left: 0;
  display: grid;
  grid-template-areas:
    'dash_l pad_l number pad_r dash_r'
    'label label label label label';
}

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
  content: '';
  height: 0px;
  border: var(--border-width-s, 0.0625rem) solid var(--Schemes-Border-low, rgb(204, 204, 204));
  margin: var(--spacing-m, 1rem) 0;
  width: 2.26rem;
}

.step-number {
  grid-area: number;
  display: grid;
  place-content: center;
  margin: 0 0 var(--spacing-xs, 0.5rem) 0;
  width: 2rem;
  height: 2rem;
  aspect-ratio: 1/1;
  background: transparent;
  border-radius: var(--border-radius-2xl, 2rem);
  font-family: var(--Label-Small-font-label-small-family, Montserrat);
  font-size: var(--Label-Small-font-label-small-size, 1rem);
  font-style: normal;
  line-height: var(--Label-Small-font-label-small-lineheight, 1.25rem); /* 142.857% */
  font-weight: 600;
}

.step-indicator li:first-child .step-number,
.step-indicator li:first-child .step-label {
  margin-left: 0;
}

.step-indicator li:last-child .step-number,
.step-indicator li:last-child .step-label {
  margin-right: 0;
}

.step-label {
  grid-area: label;
  margin: 0 auto;
  font-family: var(--Body-ExtraSmall-font-body-xs-family, Montserrat);
  font-size: var(--Body-ExtraSmall-font-body-xs-size, 0.75rem);
  font-style: normal;
  line-height: var(--Body-ExtraSmall-font-body-xs-lineheight, 1rem); /* 133.333% */
  font-weight: 400;
}

/* Done: clickable button styling */
.step-indicator li[data-state='done'] .step-number {
  width: 1.7rem;
  height: 1.7rem;
  border: var(--border-width-m, 0.125rem) solid var(--Schemes-Primary, rgb(16, 52, 244));
  color: var(--Schemes-Primary, rgb(16, 52, 244));
}

.step-indicator li[data-state='done'] .step-label:hover,
.step-indicator li[data-state='done'] .step-button:hover {
  cursor: pointer;
  text-decoration: underline;
}

.step-indicator li[data-state='done'] .step-dash-right,
.step-indicator li[data-state='done'] .step-dash-left,
.step-indicator li[data-state='current'] .step-dash-left {
  border: var(--border-width-s, 0.0625rem) solid var(--Schemes-Primary, rgb(16, 52, 244));
}

/* Current: filled primary circle with number */
.step-indicator li[data-state='current'] .step-number {
  background: var(--Schemes-Primary, rgb(16, 52, 244));
  color: var(--Schemes-On-Primary, #fff);
}

.step-indicator li[data-state='current'] .step-label {
  font-weight: 600;
}

.step-indicator li[data-state='current'] .step-label,
.step-indicator li[data-state='upcoming'] .step-label {
  color: var(--Schemes-On-Background, #000);
}

/* Upcoming: outlined circle with number */
.step-indicator li[data-state='upcoming'] .step-number {
  border: var(--border-width-m, 0.125rem) dashed var(--Schemes-Border-low, rgb(204, 204, 204));
  color: var(--Schemes-Border-high, rgb(155, 155, 155));
}
</style>
