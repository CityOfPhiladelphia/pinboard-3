<!-- ABOUTME: Renders a single wizard question's input field by question.type using phila-ui components.
     SelectField (large picklist) and textarea remain native HTML; all other types use phila-ui packages. -->
<script setup lang="ts">
import { computed } from 'vue'
import { TextField } from '@phila/phila-ui-text-field'
import { RadioGroup } from '@phila/phila-ui-radio'
import { CheckboxGroup } from '@phila/phila-ui-checkbox'
import { Switch } from '@phila/phila-ui-switch'
import { DateField } from '@phila/phila-ui-date-field'
import type { QuestionField } from '@/types/api'

const props = defineProps<{
  question: QuestionField
  modelValue: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const fieldId = computed(() => `q-${props.question.field}`)
const labelText = computed(() =>
  props.question.required ? `${props.question.label} *` : props.question.label,
)
const useRadioGroup = computed(
  () => props.question.type === 'picklist' && (props.question.options?.length ?? 0) <= 4,
)
const isLargePicklist = computed(
  () => props.question.type === 'picklist' && (props.question.options?.length ?? 0) > 4,
)

const radioChoices = computed(() =>
  (props.question.options ?? []).map((o) => ({ text: o, value: o })),
)
const checkboxChoices = computed(() =>
  (props.question.options ?? []).map((o) => ({ text: o, value: o })),
)
// RadioGroup/CheckboxGroup model a Record<choice value, checked>; the wizard
// stores answers as strings ('A' / 'A;B'), so translate at this boundary.
const radioValue = computed<Record<string, boolean>>(() =>
  Object.fromEntries((props.question.options ?? []).map((o) => [o, o === props.modelValue])),
)
const checkboxValue = computed<Record<string, boolean>>(() => {
  const checked = new Set(props.modelValue ? props.modelValue.split(';').filter(Boolean) : [])
  return Object.fromEntries((props.question.options ?? []).map((o) => [o, checked.has(o)]))
})

function set(value: string) {
  emit('update:modelValue', value)
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
  <div class="question-field" :data-type="question.type">
    <!-- picklist (≤4): RadioGroup -->
    <!-- phila-ui gap: RadioGroup has no required prop and doesn't forward $attrs to its <input type="radio"> elements -->
    <RadioGroup
      v-if="useRadioGroup"
      :group-label="labelText"
      :choices="radioChoices"
      :model-value="radioValue"
      @update:model-value="setRadio"
    />

    <!-- picklist (>4): native select -->
    <template v-else-if="isLargePicklist">
      <label :for="fieldId" class="question-field__label">{{ labelText }}</label>
      <select
        :id="fieldId"
        :value="modelValue"
        :aria-required="question.required || undefined"
        @change="set(($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>Select…</option>
        <option v-for="opt in question.options" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </template>

    <!-- multipicklist: CheckboxGroup -->
    <!-- phila-ui gap: CheckboxGroup has no required prop and doesn't forward $attrs to its <input type="checkbox"> elements -->
    <CheckboxGroup
      v-else-if="question.type === 'multipicklist'"
      :group-label="labelText"
      :choices="checkboxChoices"
      :model-value="checkboxValue"
      @update:model-value="setCheckbox"
    />

    <!-- textarea: native -->
    <template v-else-if="question.type === 'textarea'">
      <label :for="fieldId" class="question-field__label">{{ labelText }}</label>
      <textarea
        :id="fieldId"
        :value="modelValue"
        rows="3"
        :aria-required="question.required || undefined"
        @input="set(($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </template>

    <!-- date: DateField — forwards $attrs through its inner TextField to the native <input> -->
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

    <!-- number / currency / double: TextField — forwards $attrs to the native <input> -->
    <TextField
      v-else-if="['number', 'currency', 'double'].includes(question.type)"
      :id="fieldId"
      :label="labelText"
      :model-value="modelValue"
      :imask-props="{ mask: Number }"
      :aria-required="question.required || undefined"
      @update:model-value="set"
    />

    <!-- string / fallback: TextField — forwards $attrs to the native <input> -->
    <TextField
      v-else
      :id="fieldId"
      :label="labelText"
      :model-value="modelValue"
      :aria-required="question.required || undefined"
      @update:model-value="set"
    />
  </div>
</template>

<style scoped>
.question-field__label {
  display: block;
  margin-bottom: var(--spacing-xs, 4px);
  font-weight: 600;
}
</style>
