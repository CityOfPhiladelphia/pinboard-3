<!-- ABOUTME: Renders a single wizard question's input field for questions of type 'picklist'  -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
const choices = computed(() => {
  return (props.question.options ?? []).map((o) => ({ label: o, value: o }))
})

watch(
  () => props.question.field,
  () => {
    radioValue.value = Object.fromEntries(
      (props.question.options ?? []).map((o) => [o, o === props.initialValue]),
    )
  },
  { immediate: true },
)

watch(
  radioValue,
  (newValue) => {
    const keys = Object.keys(newValue)
    modelValue.value = keys.find((k) => newValue[k]) ?? ''
  },
  { deep: 1 },
)
</script>

<template>
  <!-- picklist: RadioGroup -->
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
