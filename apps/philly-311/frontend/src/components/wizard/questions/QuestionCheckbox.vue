<!-- ABOUTME: Renders a single wizard question's input field by question.type using phila-ui components.
     SelectField (large picklist) and textarea remain native HTML; all other types use phila-ui packages. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CheckboxGroup, type SelectInputGroupValue } from '@phila/phila-ui-checkbox'
import type { IQuestionField } from '@/types/api'

const checkboxErrorMsg = 'Select at least one option to continue'

const modelValue = defineModel<string | undefined>('model-value', { default: undefined })
const error = defineModel<string>('error', { default: '' })

const props = defineProps<{
  question: IQuestionField
  initialValue: string
}>()

const checkboxValue = ref<SelectInputGroupValue>({})
const choices = computed(() => {
  return (props.question.options ?? []).map((o) => ({ label: o, value: o }))
})

watch(
  () => props.question.field,
  () => {
    const checked = new Set(props.initialValue ? props.initialValue.split(';').filter(Boolean) : [])
    checkboxValue.value = Object.fromEntries(
      (props.question.options ?? []).map((o) => [o, checked.has(o)]),
    )
  },
  { immediate: true },
)

watch(
  checkboxValue,
  (newValue) => {
    modelValue.value = Object.keys(newValue)
      .filter((k) => newValue[k])
      .join(';')
  },
  { deep: 1 },
)
</script>

<template>
  <!-- multipicklist: CheckboxGroup -->
  <!-- phila-ui gap: CheckboxGroup has no required prop and doesn't forward $attrs to its <input type="checkbox"> elements -->
  <CheckboxGroup
    v-model="checkboxValue"
    :label="question.label"
    :hide-title="true"
    :choices="choices"
    :aria-required="question.required || false"
    :error="!!error"
    :error-message="checkboxErrorMsg"
  />
</template>
