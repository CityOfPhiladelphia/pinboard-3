<!-- ABOUTME: Renders a single wizard question's input field by question.type using phila-ui components.
     SelectField (large picklist) and textarea remain native HTML; all other types use phila-ui packages. -->
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

const choices = computed(() => {
  return (props.question.options ?? []).map((o) => ({ text: o, value: o }))
})

// RadioGroup/CheckboxGroup model a Record<choice value, checked>; the wizard
// stores answers as strings ('A' / 'A;B'), so translate at this boundary.l
const radioValue = computed<Record<string, boolean>>(() => {
  let a
  a = Object.fromEntries((props.question.options ?? []).map((o) => [o, o === props.initialValue]))
  console.log(a)
  return a
})

function setRadio(record: Record<string, boolean>) {
  const keys = Object.keys(record)
  modelValue.value = keys.find((k) => record[k]) ?? ''
}
</script>

<template>
  <!-- picklist: RadioGroup -->
  <!-- phila-ui gap: RadioGroup has no required prop and doesn't forward $attrs to its <input type="radio"> elements -->
  <!-- group-label always renders the real text (RadioGroup has no accessible-name prop of its
         own); hideLabel visually hides it via the :deep() rule below instead of emptying it. -->
  <RadioGroup
    v-if="['boolean', 'picklist'].includes(question.type)"
    :group-label="question.label"
    :hide-title="{ hideFromScreenReader: true }"
    :choices="choices"
    :model-value="radioValue"
    :aria-required="question.required || false"
    :error="!!error"
    :error-message="radioErrorMsg"
    @update:model-value="setRadio"
  />
</template>
