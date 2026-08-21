<!-- ABOUTME: Wizard step 4 — details: question subcomponent. Uses ReportStep to standardize formatting for QuestionFields -->
<script setup lang="ts">
import QuestionField from '@/components/wizard/QuestionField.vue'
import ReportStep from './ReportStep.vue'
import type { IQuestionField } from '@/types/api.ts'

const props = defineProps<{ current: IQuestionField }>()
const response = defineModel<string>('response', { default: '' })
const error = defineModel<string>('error')
</script>

<template>
  <ReportStep
    :step-title="props.current.label"
    :error-active="!!error"
    :step-note="current.description"
    :required="props.current.required"
  >
    <template #step-content>
      <QuestionField v-model:model-value="response" v-model:error="error" :question="current" />
    </template>
  </ReportStep>
</template>
