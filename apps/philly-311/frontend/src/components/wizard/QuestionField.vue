<!-- ABOUTME: Renders a single wizard question's input field by question.type using phila-ui components.
     SelectField (large picklist) and textarea remain native HTML; all other types use phila-ui packages. -->
<script setup lang="ts">
import { computed, useId } from 'vue'
import { TextField } from '@phila/phila-ui-text-field'
import { RadioGroup } from '@phila/phila-ui-radio'
import { CheckboxGroup } from '@phila/phila-ui-checkbox'
import { Switch } from '@phila/phila-ui-switch'
import { DateField } from '@phila/phila-ui-date-field'
import type { IQuestionField } from '@/types/api'

const props = defineProps<{
  question: IQuestionField
}>()

const modelValue = defineModel<string>('model-value', { default: '' })
const error = defineModel<string>('error')

const fieldId = useId()

const labelText = computed(() =>
  props.question.required ? `${props.question.label} *` : props.question.label,
)

const choices = computed(() => (props.question.options ?? []).map((o) => ({ text: o, value: o })))
// RadioGroup/CheckboxGroup model a Record<choice value, checked>; the wizard
// stores answers as strings ('A' / 'A;B'), so translate at this boundary.l
const radioValue = computed<Record<string, boolean>>(() =>
  Object.fromEntries((props.question.options ?? []).map((o) => [o, o === modelValue.value])),
)

const checkboxValue = computed<Record<string, boolean>>(() => {
  const checked = new Set(modelValue.value ? modelValue.value.split(';').filter(Boolean) : [])
  return Object.fromEntries((props.question.options ?? []).map((o) => [o, checked.has(o)]))
})

function set(value: string) {
  modelValue.value = value
}
function setRadio(record: Record<string, boolean>) {
  set(Object.keys(record).find((k) => record[k]) ?? '')
}
function setCheckbox(record: Record<string, boolean>) {
  set(
    Object.keys(record)
      .filter((k) => record[k])
      .join(';'),
  )
}
</script>

<template>
  <div
    class="question-field"
    :class="{ 'question-field--error': !!error }"
    :data-type="question.type"
  >
    <!-- picklist (≤4): RadioGroup -->
    <!-- phila-ui gap: RadioGroup has no required prop and doesn't forward $attrs to its <input type="radio"> elements -->
    <!-- group-label always renders the real text (RadioGroup has no accessible-name prop of its
         own); hideLabel visually hides it via the :deep() rule below instead of emptying it. -->
    <RadioGroup
      v-if="question.type === 'picklist'"
      :group-label="labelText"
      :choices="choices"
      :model-value="radioValue"
      @update:model-value="setRadio"
    />

    <!-- multipicklist: CheckboxGroup -->
    <!-- phila-ui gap: CheckboxGroup has no required prop and doesn't forward $attrs to its <input type="checkbox"> elements -->
    <CheckboxGroup
      v-else-if="question.type === 'multipicklist'"
      :group-label="labelText"
      :choices="choices"
      :model-value="checkboxValue"
      @update:model-value="setCheckbox"
    />

    <!-- date: DateField — forwards $attrs through its inner TextField to the native <input>.
         label always renders the real text (TextField's aria-label fallback only applies when
         label is empty, and mergeProps in its dist build clobbers an explicit aria-label attr
         anyway); hideLabel visually hides the rendered <label> via the :deep() rule below. -->
    <DateField
      v-else-if="question.type === 'date'"
      :id="fieldId"
      :label="labelText"
      :model-value="modelValue"
      :aria-required="question.required || undefined"
      @update:model-value="set"
    />

    <!-- boolean: Switch -->
    <!-- phila-ui gap: Switch hardcodes its inner checkbox attrs and doesn't forward $attrs to <input type="checkbox"> -->
    <Switch
      v-else-if="question.type === 'boolean'"
      :id="fieldId"
      :model-value="modelValue"
      value="true"
      off-value="false"
      :aria-label="labelText"
      @update:model-value="(v: string | number | boolean) => set(String(v))"
    />

    <!-- number / currency / double: TextField — forwards $attrs to the native <input>.
         label always renders the real text (TextField's dist build clobbers an explicit
         aria-label attr with its own, empty-when-labeled fallback); hideLabel visually hides
         the rendered <label> via the :deep() rule below instead. -->
    <TextField
      v-else
      :id="fieldId"
      :label="labelText"
      :model-value="modelValue"
      :imask-props="
        ['number', 'currency', 'double'].includes(question.type) ? { mask: Number } : undefined
      "
      :aria-required="question.required || undefined"
      @update:model-value="set"
    />
    <p v-if="error" class="question-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.question-field--error {
  background: var(--Schemes-Error-Container, #f8c9bd);
  border-radius: 12px;
  padding: 16px;
}

.question-field__error {
  margin: var(--spacing-s, 0.75rem) 0 0;
  color: var(--Schemes-On-Error-Container, #992100);
  font-weight: 600;
}
</style>
