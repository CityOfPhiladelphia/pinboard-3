<!-- ABOUTME: Wizard step 4 — details: question subcomponent. Uses ReportStep to standardize formatting for QuestionFields -->
<script setup lang="ts">
import QuestionBoolean from '@/components/wizard/questions/QuestionBoolean.vue'
import QuestionRadio from '@/components/wizard/questions/QuestionRadio.vue'
import QuestionCheckbox from '@/components/wizard/questions/QuestionCheckbox.vue'
import QuestionDate from '@/components/wizard/questions/QuestionDate.vue'
import QuestionTextfield from '@/components/wizard/questions/QuestionTextfield.vue'
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
      <div
        class="question-field"
        :class="{ 'question-field__error': !!error }"
        :data-type="current.type"
      >
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
      </div>
    </template>
  </ReportStep>
</template>

<style scoped>
.question-field {
  width: fit-content;
}

.question-field__error {
  font-weight: 600;
  border-radius: 12px;
  color: var(--Schemes-On-Error-Container, #992100);
  background: var(--Schemes-Error-Container, #f8c9bd);
}
</style>
