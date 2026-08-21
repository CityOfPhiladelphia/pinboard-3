<!-- ABOUTME: Wizard step 4 — details: walks the issue type's questions one per
     screen (auto-advancing single-choice answers), ending with the required
     description (10-char floor), contact info, and report visibility. -->
<script setup lang="ts">
import { computed } from 'vue'
import QuestionField from '@/components/wizard/QuestionField.vue'
import ReportStep from './ReportStep.vue'
import type { IQuestionField } from '@/types/api.ts'

const props = defineProps<{ current: IQuestionField }>()
const response = defineModel<string>('response', { default: '' })
const error = defineModel<string>('error')

const stepTitle = computed(() =>
  props.current.label
    ? `${props.current.label}${props.current.required ? ' * (required)' : ''}`
    : 'Details',
)
</script>

<template>
  <ReportStep :step-title="stepTitle" :step-note="current.description">
    <template #step-content>
      <QuestionField
        :key="current.field"
        v-model:model-value="response"
        v-model:error="error"
        :question="current"
      />
    </template>
  </ReportStep>
</template>

<style scoped></style>
