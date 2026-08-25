<!-- ABOUTME: Renders a single wizard question's input field by question.type using phila-ui components.
     SelectField (large picklist) and textarea remain native HTML; all other types use phila-ui packages. -->
<script setup lang="ts">
import { computed, useId } from 'vue'
import { DateField } from '@phila/phila-ui-date-field'
import type { IQuestionField } from '@/types/api'

const fieldId = useId()

const props = defineProps<{
  question: IQuestionField
  initialValue: string
}>()

const modelValue = defineModel<string>('model-value')
const error = defineModel<string>('error')

const labelText = computed(() =>
  props.question.required ? `${props.question.label} *` : props.question.label,
)

function set(value: string) {
  modelValue.value = value
}

function validateDate(inputDate: string) {
  if (Date.now() >= Date.parse(inputDate)) {
    set(inputDate)
  } else {
    error.value = 'Date cannot be in the future'
  }
}

function clearError() {
  console.log('clearError')
  if (error.value) error.value = ''
}
</script>

<template>
  <!-- date: DateField — forwards $attrs through its inner TextField to the native <input>.
         label always renders the real text (TextField's aria-label fallback only applies when
         label is empty, and mergeProps in its dist build clobbers an explicit aria-label attr
         anyway); hideLabel visually hides the rendered <label> via the :deep() rule below. -->
  <DateField
    :id="fieldId"
    :label="labelText"
    :model-value="initialValue"
    :max="Date.now()"
    :aria-required="question.required || false"
    @complete="validateDate"
    @update:model-value="clearError"
  />
</template>
