<!-- ABOUTME: Renders a single wizard question's input field for questions of type 'boolean'  -->
<script setup lang="ts">
import { RadioGroup } from '@phila/phila-ui-radio'
import type { IQuestionField } from '@/types/api'

const radioErrorMsg = 'Select an option to continue'

defineProps<{
  question: IQuestionField
  initialValue: string
}>()

const modelValue = defineModel<string | undefined>('model-value', { default: undefined })
const error = defineModel<string>('error', { default: '' })

const choices = [
  {
    text: 'Yes',
    value: 'Yes',
  },
  {
    text: 'No',
    value: 'No',
  },
]

function setBoolean(record: Record<string, boolean>) {
  modelValue.value = String(record['Yes'])
}
</script>

<template>
  <!-- boolean: RadioGroup -->
  <!-- phila-ui gap: RadioGroup has no required prop and doesn't forward $attrs to its <input type="radio"> elements -->
  <!-- group-label always renders the real text (RadioGroup has no accessible-name prop of its
         own); hideLabel visually hides it via the :deep() rule below instead of emptying it. -->
  <RadioGroup
    :group-label="question.label"
    :hide-title="{ hideFromScreenReader: false }"
    :choices="choices"
    :model-value="{
      Yes: initialValue === 'true',
      No: initialValue === 'false',
    }"
    :aria-required="question.required || false"
    :error="!!error"
    :error-message="radioErrorMsg"
    @update:model-value="setBoolean"
  />
</template>
