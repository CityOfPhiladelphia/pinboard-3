<!-- ABOUTME: Grouped vertical step tracker for ReportDetailContent's "Next Steps" section.
     Each section (e.g. "Philly311", then the servicing department) renders its steps as a
     circle + connector line + title/subtitle column; circles are complete, active, or
     upcoming relative to a single currentStep index counted across all sections. -->
<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@phila/phila-ui-core'
import { IconCheck } from '@phila/phila-ui-core/icons'
import type { ReportStepSection } from '@/composables/useReportSteps'

const props = defineProps<{
  sections: ReportStepSection[]
  currentStep: number
}>()

type StepState = 'complete' | 'active' | 'upcoming'

function stateFor(globalIndex: number): StepState {
  if (globalIndex < props.currentStep) return 'complete'
  if (globalIndex === props.currentStep) return 'active'
  return 'upcoming'
}

/** Each section's steps, annotated with their 0-based index across all sections. */
const indexedSections = computed(() => {
  let index = 0
  return props.sections.map((section) => ({
    ...section,
    steps: section.steps.map((step) => ({ ...step, globalIndex: index++ })),
  }))
})

function stepLabel(title: string, subtitle: string | undefined, state: StepState): string {
  const stateLabel = state === 'active' ? 'in progress' : state
  return subtitle ? `${title}, ${subtitle}, ${stateLabel}` : `${title}, ${stateLabel}`
}
</script>

<template>
  <div class="report-step-progress">
    <div
      v-for="section in indexedSections"
      :key="section.title"
      class="report-step-progress__section"
    >
      <h3 class="report-step-progress__section-title">{{ section.title }}</h3>
      <div
        v-for="(step, i) in section.steps"
        :key="step.title"
        class="report-step-progress__step"
        :aria-label="stepLabel(step.title, step.subtitle, stateFor(step.globalIndex))"
      >
        <div class="report-step-progress__marker">
          <div
            class="report-step-progress__circle"
            :class="`report-step-progress__circle--${stateFor(step.globalIndex)}`"
            aria-hidden="true"
          >
            <Icon
              v-if="stateFor(step.globalIndex) === 'complete'"
              :icon="IconCheck"
              decorative
              size="extra-small"
            />
            <span v-else>{{ step.globalIndex + 1 }}</span>
          </div>
          <div
            v-if="i < section.steps.length - 1"
            class="report-step-progress__line"
            :class="{
              'report-step-progress__line--complete': stateFor(step.globalIndex) === 'complete',
            }"
            aria-hidden="true"
          />
        </div>
        <div class="report-step-progress__text">
          <div
            class="report-step-progress__title"
            :class="{
              'report-step-progress__title--active': stateFor(step.globalIndex) === 'active',
            }"
          >
            {{ step.title }}
          </div>
          <div v-if="step.subtitle" class="report-step-progress__subtitle">{{ step.subtitle }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-step-progress {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-l, 1.5rem);
}
.report-step-progress__section-title {
  margin: 0 0 var(--spacing-s, 0.75rem);
  font-size: var(--Label-Large-font-label-large-size, 1.125rem);
}
.report-step-progress__step {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-s, 1rem);
}
.report-step-progress__marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 32px;
}
.report-step-progress__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--Schemes-Border-low, #ccc);
  font-weight: 600;
  color: var(--Schemes-On-Surface-Low, #636363);
}
.report-step-progress__circle--complete {
  border-color: var(--Schemes-Primary, #0f4d90);
  color: var(--Schemes-Primary, #0f4d90);
}
.report-step-progress__circle--active {
  border-color: var(--Schemes-Primary, #0f4d90);
  background: var(--Schemes-Primary, #0f4d90);
  color: var(--Schemes-On-Primary, white);
}
.report-step-progress__circle--upcoming {
  border-style: dashed;
}
.report-step-progress__line {
  width: 2px;
  flex: 1 0 24px;
  min-height: 24px;
  background: var(--Schemes-Border-low, #ccc);
}
.report-step-progress__line--complete {
  background: var(--Schemes-Primary, #0f4d90);
}
.report-step-progress__text {
  padding-top: 0.25rem;
  padding-bottom: var(--spacing-m, 1rem);
}
.report-step-progress__title--active {
  font-weight: 600;
}
.report-step-progress__subtitle {
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
  font-size: var(--Body-Small-font-body-small-size, 0.875rem);
}
</style>
