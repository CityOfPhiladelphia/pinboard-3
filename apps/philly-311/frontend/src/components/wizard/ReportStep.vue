<!-- ABOUTME: Template for report pages. Standardizes step headings -->
<script setup lang="ts">
import { computed, watch } from 'vue'

// props
const props = withDefaults(
  defineProps<{
    stepTitle: string
    required: boolean
    hideRequired?: boolean
    errorActive: boolean
    stepNote?: string
  }>(),
  {
    stepNote: '',
  },
)

watch(
  () => props.errorActive,
  () => {
    console.log('Awr nawr!')
  },
)

// slots
defineSlots<{
  'step-content': unknown
}>()

const requiredText = computed(() => `(${props.required ? 'required' : 'optional'})`)
const titleText = computed(() => `${props.stepTitle} *`)
</script>

<template>
  <div class="report__step">
    <span class="report-step__title">
      <h5 class="report-step__text" v-text="titleText" />
      <h5 class="report-step__required" v-text="requiredText" />
    </span>
    <span class="report-step__note" v-text="stepNote" />
    <div class="report-step__content">
      <slot name="step-content" />
    </div>
  </div>
</template>

<style scoped>
.report__step {
  display: grid;
  height: 100%;
  grid-template-areas:
    'title'
    'note'
    'content-slot';
  grid-auto-rows: auto auto 1fr;
  row-gap: var(--spacing-xs, 0.5rem);
  color: var(--Schemes-On-Surface-High, #000);
}

.report-step__title {
  grid-area: title;
  display: grid;
  grid-template-areas: 'title-text title-required';
  grid-template-columns: max-content max-content;
  column-gap: 1ch;
}

.report-step__text {
  grid-area: title-text;
  font-style: normal;
  font-weight: 600;
}

.report-step__required {
  grid-area: title-required;
  font-style: italic;
  font-weight: 400;
}

.report-step__note {
  grid-area: note;
  max-width: 39rem;
  color: var(--Schemes-On-Background, #000);

  /* Body/Default */
  font-family: var(--Body-Default-font-body-default-family, Montserrat);
  font-size: var(--Body-Default-font-body-default-size, 1rem);
  font-style: normal;
  font-weight: 400;
  line-height: var(--Body-Default-font-body-default-lineheight, 1.5rem); /* 150% */
}

.report-step__content {
  grid-area: content-slot;
  overflow: auto;
}
</style>
