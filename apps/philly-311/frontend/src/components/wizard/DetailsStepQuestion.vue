<!-- ABOUTME: Wizard step 4 — details: question subcomponent. Uses ReportStep to standardize formatting for QuestionFields -->
<script setup lang="ts">
import QuestionBoolean from '@/components/wizard/QuestionBoolean.vue'
import QuestionRadio from '@/components/wizard/QuestionRadio.vue'
import QuestionCheckbox from '@/components/wizard/QuestionCheckbox.vue'
import QuestionDate from '@/components/wizard/QuestionDate.vue'
import QuestionTextfield from '@/components/wizard/QuestionTextfield.vue'
import ReportStep from './ReportStep.vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import type { IQuestionField } from '@/types/api.ts'
import { computed } from 'vue'

const props = defineProps<{ current: IQuestionField }>()
const response = defineModel<string>('response')
const error = defineModel<string>('error')

const store = useReportSubmissionStore()

const initialValue = computed(() => {
  return store.customFields?.[props.current.field] ?? ''
})
</script>

<template>
  <ReportStep
    :step-title="current.label"
    :error-active="!!error"
    :step-note="current.description"
    :required="current.required"
  >
    <template #step-content>
      <QuestionBoolean
        v-if="current.type === 'boolean'"
        v-model:model-value="response"
        v-model:error="error"
        :question="current"
        :initial-value="initialValue"
      />
      <QuestionRadio
        v-else-if="current.type === 'picklist'"
        v-model:model-value="response"
        v-model:error="error"
        :question="current"
        :initial-value="initialValue"
      />
      <QuestionCheckbox
        v-else-if="current.type === 'multipicklist'"
        v-model:model-value="response"
        v-model:error="error"
        :question="current"
        :initial-value="initialValue"
      />
      <QuestionDate
        v-else-if="current.type === 'date'"
        v-model:model-value="response"
        v-model:error="error"
        :question="current"
        :initial-value="initialValue"
      />
      <QuestionTextfield
        v-else
        v-model:model-value="response"
        v-model:error="error"
        :question="current"
        :initial-value="initialValue"
      />
    </template>
  </ReportStep>
</template>
