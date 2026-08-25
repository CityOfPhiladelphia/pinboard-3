<!-- ABOUTME: Renders a single wizard question's input field by question.type using phila-ui components.
     SelectField (large picklist) and textarea remain native HTML; all other types use phila-ui packages. -->
<script setup lang="ts">
import { computed, useId } from 'vue'
import { TextField } from '@phila/phila-ui-text-field'
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

const textFieldImask = computed(() =>
  ['number', 'currency', 'double'].includes(props.question.type) ? { mask: Number } : undefined,
)

function set(value: string) {
  modelValue.value = value
}
</script>

<template>
  <!-- number / currency / double: TextField — forwards $attrs to the native <input>.
         label always renders the real text (TextField's dist build clobbers an explicit
         aria-label attr with its own, empty-when-labeled fallback); hideLabel visually hides
         the rendered <label> via the :deep() rule below instead. -->
  <TextField
    :id="fieldId"
    :label="labelText"
    :model-value="initialValue"
    :imask-props="textFieldImask"
    :aria-required="question.required || false"
    :error="error"
    @update:model-value="set"
    @complete="set"
  />
</template>
