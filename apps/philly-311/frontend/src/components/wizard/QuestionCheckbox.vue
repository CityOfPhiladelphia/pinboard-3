<!-- ABOUTME: Renders a single wizard question's input field by question.type using phila-ui components.
     SelectField (large picklist) and textarea remain native HTML; all other types use phila-ui packages. -->
<script setup lang="ts">
import { computed } from 'vue'
import { CheckboxGroup } from '@phila/phila-ui-checkbox'
import type { IQuestionField } from '@/types/api'

const checkboxErrorMsg = 'Select at least one option to continue'

const props = defineProps<{
  question: IQuestionField
  initialValue: string
}>()

const modelValue = defineModel<string>('model-value')
const error = defineModel<string>('error')

const choices = computed(() => {
  return (props.question.options ?? []).map((o) => ({ text: o, value: o }))
})

// RadioGroup/CheckboxGroup model a Record<choice value, checked>; the wizard
// stores answers as strings ('A' / 'A;B'), so translate at this boundary.l
const checkboxValue = computed<Record<string, boolean>>(() => {
  const checked = new Set(props.initialValue ? props.initialValue.split(';').filter(Boolean) : [])
  return Object.fromEntries((props.question.options ?? []).map((o) => [o, checked.has(o)]))
})

function setCheckbox(record: Record<string, boolean>) {
  modelValue.value = Object.keys(record)
    .filter((k) => record[k])
    .join(';')
}
</script>

<template>
  <!-- multipicklist: CheckboxGroup -->
  <!-- phila-ui gap: CheckboxGroup has no required prop and doesn't forward $attrs to its <input type="checkbox"> elements -->
  <CheckboxGroup
    :group-label="question.label"
    :hide-title="{ hideFromScreenReader: true }"
    :choices="choices"
    :model-value="checkboxValue"
    :aria-required="question.required || false"
    :error="!!error"
    :error-message="checkboxErrorMsg"
    @update:model-value="setCheckbox"
  />
</template>
