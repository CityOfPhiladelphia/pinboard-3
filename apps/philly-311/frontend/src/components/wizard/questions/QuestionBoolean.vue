<!-- ABOUTME: Renders a single wizard question's input field for questions of type 'boolean'  -->
<script setup lang="ts">
import { computed } from 'vue'
import { RadioGroup } from '@phila/phila-ui-radio'
import type { IQuestionField } from '@/types/api'

const radioErrorMsg = 'Select an option to continue'

const props = defineProps<{
  question: IQuestionField
  initialValue: string
}>()

const modelValue = defineModel<string>('model-value')
const error = defineModel<string>('error')

const choices = [
  {
    text: 'Yes',
    value: 'true',
  },
  {
    text: 'No',
    value: 'false',
  },
]

const booleanValue = computed<Record<string, boolean>>(() => {
  let a
  console.log('initial: ', props.initialValue)
  if (props.initialValue === 'true') {
    a = {
      Yes: true,
      No: false,
    }
  } else if (props.initialValue === 'false') {
    a = {
      Yes: false,
      No: true,
    }
  } else {
    a = {
      Yes: false,
      No: false,
    }
  }
  console.log(a)
  return a
})

function setBoolean(record: Record<string, boolean>) {
  modelValue.value = String(record['true'])
}
</script>

<template>
  <!-- picklist: RadioGroup -->
  <!-- phila-ui gap: RadioGroup has no required prop and doesn't forward $attrs to its <input type="radio"> elements -->
  <!-- group-label always renders the real text (RadioGroup has no accessible-name prop of its
         own); hideLabel visually hides it via the :deep() rule below instead of emptying it. -->
  <RadioGroup
    :group-label="question.label"
    :hide-title="{ hideFromScreenReader: true }"
    :choices="choices"
    :model-value="booleanValue"
    :aria-required="question.required || false"
    :error="!!error"
    :error-message="radioErrorMsg"
    @update:model-value="setBoolean"
  />
</template>
