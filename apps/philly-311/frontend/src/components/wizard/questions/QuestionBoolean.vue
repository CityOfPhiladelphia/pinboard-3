<!-- ABOUTME: Renders a single wizard question's input field for questions of type 'boolean'  -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { RadioGroup } from '@phila/phila-ui-radio'
import type { SelectInputGroupValue } from '@phila/phila-ui-checkbox'
import type { IQuestionField } from '@/types/api'

const radioErrorMsg = 'Select an option to continue'

const modelValue = defineModel<string | undefined>('model-value', { default: undefined })
const error = defineModel<string>('error', { default: '' })

const props = defineProps<{
  question: IQuestionField
  initialValue: string
}>()

const radioValue = ref<SelectInputGroupValue>({})
const choices = [
  {
    label: 'Yes',
    value: 'Yes',
  },
  {
    label: 'No',
    value: 'No',
  },
]

watch(
  () => props.question.field,
  () => {
    radioValue.value = {
      Yes: props.initialValue === 'true',
      No: props.initialValue === 'false',
    }
  },
  { immediate: true },
)

watch(
  radioValue,
  (newValue) => {
    const keys = Object.keys(newValue)
    modelValue.value = keys.find((k) => newValue[k]) ?? ''
    console.log(modelValue.value)
  },
  { deep: 1 },
)
</script>

<template>
  <!-- picklist: RadioGroup -->
  <!-- phila-ui gap: RadioGroup has no required prop and doesn't forward $attrs to its <input type="radio"> elements -->
  <!-- group-label always renders the real text (RadioGroup has no accessible-name prop of its
         own); hideLabel visually hides it via the :deep() rule below instead of emptying it. -->
  <RadioGroup
    v-model="radioValue"
    :label="question.label"
    :hide-title="true"
    :choices="choices"
    :aria-required="question.required || false"
    :error="!!error"
    :error-message="radioErrorMsg"
  />
</template>
