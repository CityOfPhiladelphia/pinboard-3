<!-- ABOUTME: Renders a single wizard question's input field by question.type using phila-ui components.
     SelectField (large picklist) and textarea remain native HTML; all other types use phila-ui packages. -->
<script setup lang="ts">
import { computed, useId } from 'vue'
import { TextField } from '@phila/phila-ui-text-field'
import { RadioGroup } from '@phila/phila-ui-radio'
import { CheckboxGroup } from '@phila/phila-ui-checkbox'
import { DateField } from '@phila/phila-ui-date-field'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import type { IQuestionField } from '@/types/api'

const radioErrorMsg = 'Select an option to continue'
const checkboxErrorMsg = 'Select at least one option to continue'

const fieldId = useId()

const props = defineProps<{
  question: IQuestionField
}>()

const modelValue = defineModel<string>('model-value')
const error = defineModel<string>('error')

const store = useReportSubmissionStore()

const initial = computed(() => {
  return store.customFields?.[props.question.field]
})

const labelText = computed(() =>
  props.question.required ? `${props.question.label} *` : props.question.label,
)

const textFieldImask = computed(() =>
  ['number', 'currency', 'double'].includes(props.question.type) ? { mask: Number } : undefined,
)

const choices = computed(() => {
  if (props.question.type === 'boolean') {
    return [
      {
        text: 'Yes',
        value: 'true',
      },
      {
        text: 'No',
        value: 'false',
      },
    ]
  }
  return (props.question.options ?? []).map((o) => ({ text: o, value: o }))
})

// RadioGroup/CheckboxGroup model a Record<choice value, checked>; the wizard
// stores answers as strings ('A' / 'A;B'), so translate at this boundary.l
const radioValue = computed<Record<string, boolean>>(() => {
  let a
  if (props.question.type === 'boolean') {
    console.log('initial: ', initial.value)
    if (initial.value === 'true') {
      a = {
        Yes: true,
        No: false,
      }
    } else if (initial.value === 'false') {
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
  } else {
    a = Object.fromEntries((props.question.options ?? []).map((o) => [o, o === initial.value]))
  }
  console.log(a)
  return a
})

const checkboxValue = computed<Record<string, boolean>>(() => {
  const checked = new Set(initial.value ? initial.value.split(';').filter(Boolean) : [])
  return Object.fromEntries((props.question.options ?? []).map((o) => [o, checked.has(o)]))
})

function set(value: string) {
  modelValue.value = value
}

function setRadio(record: Record<string, boolean>) {
  const keys = Object.keys(record)
  if (keys.includes('true')) {
    set(String(record['true']))
  } else {
    set(keys.find((k) => record[k]) ?? '')
  }
}

function setCheckbox(record: Record<string, boolean>) {
  set(
    Object.keys(record)
      .filter((k) => record[k])
      .join(';'),
  )
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
  <div
    class="question-field"
    :class="{ 'question-field__error': !!error }"
    :data-type="question.type"
  >
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

    <!-- multipicklist: CheckboxGroup -->
    <!-- phila-ui gap: CheckboxGroup has no required prop and doesn't forward $attrs to its <input type="checkbox"> elements -->
    <CheckboxGroup
      v-else-if="question.type === 'multipicklist'"
      :group-label="question.label"
      :hide-title="{ hideFromScreenReader: true }"
      :choices="choices"
      :model-value="checkboxValue"
      :aria-required="question.required || false"
      :error="!!error"
      :error-message="checkboxErrorMsg"
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
      :model-value="initial"
      :max="Date.now()"
      :aria-required="question.required || false"
      @complete="validateDate"
      @update:model-value="clearError"
    />

    <!-- number / currency / double: TextField — forwards $attrs to the native <input>.
         label always renders the real text (TextField's dist build clobbers an explicit
         aria-label attr with its own, empty-when-labeled fallback); hideLabel visually hides
         the rendered <label> via the :deep() rule below instead. -->
    <TextField
      v-else
      :id="fieldId"
      :model-value="initial"
      :imask-props="textFieldImask"
      :aria-required="question.required || false"
      @update:model-value="set"
      @complete="set"
    />
  </div>
</template>

<style scoped>
.question-field {
  width: fit-content;
}

.question-field__error {
  font-weight: 600;
  border-radius: 12px;
  color: var(--Schemes-On-Error-Container, #992100);
  background: var(--Schemes-Error-Container, #f8c9bd);
}
</style>
