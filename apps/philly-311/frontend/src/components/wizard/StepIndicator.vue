<!-- ABOUTME: Wizard step indicator with click-to-jump on completed steps.
     Marks the current step with aria-current="step" and labels via SR-only text. -->
<script setup lang="ts">
import { computed } from 'vue'

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
        <button v-if="step.clickable" type="button" @click="emit('navigate', step.path)">
          <span class="sr-only">Step {{ step.n }} of {{ steps.length }}: </span>
          {{ step.title }}
        </button>
        <span v-else :aria-current="step.state === 'current' ? 'step' : undefined">
          <span class="sr-only">Step {{ step.n }} of {{ steps.length }}: </span>
          {{ step.title }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.step-indicator ol {
  display: flex;
  align-items: center;
  list-style: none;
  padding: var(--spacing-m, 1rem) 0;
  margin: 0;
  gap: 0;
}

.step-indicator li {
  display: flex;
  align-items: center;
  flex: 1;
  position: relative;
}

/* Connecting line between steps */
.step-indicator li:not(:last-child)::after {
  content: '';
  flex: 1;
  height: 2px;
  background: var(--Schemes-Border-low, #ccc);
  margin: 0 var(--spacing-xs, 0.5rem);
}

.step-indicator li[data-state='done']::after {
  background: var(--Schemes-Primary, #0f4d90);
}

/* Base style for both button and span step labels */
.step-indicator li button,
.step-indicator li span:not(.sr-only) {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.5rem);
  font-size: 0.875rem;
  white-space: nowrap;
}

/* Numbered circle indicator via ::before — counter-reset on ol, counter-increment on li */
.step-indicator ol {
  counter-reset: step-counter;
}

.step-indicator li {
  counter-increment: step-counter;
}

.step-indicator li button::before,
.step-indicator li span:not(.sr-only)::before {
  content: counter(step-counter);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

/* Done: filled primary circle */
.step-indicator li[data-state='done'] button::before {
  content: '✓';
  background: var(--Schemes-Primary, #0f4d90);
  color: #fff;
  border: 2px solid var(--Schemes-Primary, #0f4d90);
}

/* Done: clickable button styling */
.step-indicator li[data-state='done'] button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--Schemes-Primary, #0f4d90);
  font-weight: 500;
}

.step-indicator li[data-state='done'] button:hover {
  text-decoration: underline;
}

/* Current: filled primary circle with number */
.step-indicator li[data-state='current'] span:not(.sr-only)::before {
  background: var(--Schemes-Primary, #0f4d90);
  color: #fff;
  border: 2px solid var(--Schemes-Primary, #0f4d90);
}

.step-indicator li[data-state='current'] span:not(.sr-only) {
  color: var(--Schemes-Primary, #0f4d90);
  font-weight: 700;
}

/* Upcoming: outlined circle with number */
.step-indicator li[data-state='upcoming'] span:not(.sr-only)::before {
  background: transparent;
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
  border: 2px solid var(--Schemes-Border-low, #ccc);
}

.step-indicator li[data-state='upcoming'] span:not(.sr-only) {
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
  font-weight: 400;
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
