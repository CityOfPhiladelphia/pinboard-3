// ABOUTME: Verifies QuestionField renders the right phila-ui component per type and emits
// ABOUTME: update:modelValue with the right value shape (incl. multipicklist join).
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { TextField } from '@phila/phila-ui-text-field'
import { RadioGroup } from '@phila/phila-ui-radio'
import { CheckboxGroup } from '@phila/phila-ui-checkbox'
import { Switch } from '@phila/phila-ui-switch'
import { DateField } from '@phila/phila-ui-date-field'
import QuestionField from './QuestionField.vue'
import type { QuestionField as Q } from '@/types/api'

function make(overrides: Partial<Q> = {}): Q {
  return {
    field: 'F',
    label: 'F label',
    type: 'string',
    required: false,
    ...overrides,
  }
}

describe('QuestionField rendering by type', () => {
  it('picklist with ≤4 options renders RadioGroup', () => {
    const w = mount(QuestionField, {
      props: { question: make({ type: 'picklist', options: ['A', 'B'] }), modelValue: '' },
    })
    expect(w.findComponent(RadioGroup).exists()).toBe(true)
    expect(w.find('select').exists()).toBe(false)
  })

  it('picklist with >4 options renders native select', () => {
    const w = mount(QuestionField, {
      props: {
        question: make({ type: 'picklist', options: ['A', 'B', 'C', 'D', 'E'] }),
        modelValue: '',
      },
    })
    expect(w.find('select').exists()).toBe(true)
    expect(w.findAll('option')).toHaveLength(6) // placeholder + 5
    expect(w.findComponent(RadioGroup).exists()).toBe(false)
  })

  it('multipicklist renders CheckboxGroup', () => {
    const w = mount(QuestionField, {
      props: {
        question: make({ type: 'multipicklist', options: ['A', 'B', 'C'] }),
        modelValue: '',
      },
    })
    expect(w.findComponent(CheckboxGroup).exists()).toBe(true)
  })

  it('textarea type renders native <textarea>', () => {
    const w = mount(QuestionField, {
      props: { question: make({ type: 'textarea' }), modelValue: '' },
    })
    expect(w.find('textarea').exists()).toBe(true)
  })

  it('date type renders DateField', () => {
    const w = mount(QuestionField, {
      props: { question: make({ type: 'date' }), modelValue: '' },
    })
    expect(w.findComponent(DateField).exists()).toBe(true)
  })

  it('boolean type renders Switch', () => {
    const w = mount(QuestionField, {
      props: { question: make({ type: 'boolean' }), modelValue: 'false' },
    })
    expect(w.findComponent(Switch).exists()).toBe(true)
  })

  it('double/number/currency type renders TextField', () => {
    for (const t of ['double', 'number', 'currency'] as const) {
      const w = mount(QuestionField, { props: { question: make({ type: t }), modelValue: '' } })
      expect(w.findComponent(TextField).exists()).toBe(true)
    }
  })

  it('string type renders TextField', () => {
    const w = mount(QuestionField, {
      props: { question: make({ type: 'string' }), modelValue: '' },
    })
    expect(w.findComponent(TextField).exists()).toBe(true)
  })
})

describe('QuestionField label text', () => {
  it('appends * to TextField label when required', () => {
    const w = mount(QuestionField, {
      props: { question: make({ required: true, label: 'My Field' }), modelValue: '' },
    })
    expect(w.findComponent(TextField).props('label')).toBe('My Field *')
  })

  it('does not append * to TextField label when not required', () => {
    const w = mount(QuestionField, {
      props: { question: make({ required: false, label: 'My Field' }), modelValue: '' },
    })
    expect(w.findComponent(TextField).props('label')).toBe('My Field')
  })

  it('appends * to RadioGroup groupLabel when required', () => {
    const w = mount(QuestionField, {
      props: {
        question: make({
          type: 'picklist',
          options: ['A', 'B'],
          required: true,
          label: 'My Field',
        }),
        modelValue: '',
      },
    })
    expect(w.findComponent(RadioGroup).props('groupLabel')).toBe('My Field *')
  })
})

describe('QuestionField choices shape', () => {
  it('RadioGroup receives choices as {text, value} objects', () => {
    const w = mount(QuestionField, {
      props: { question: make({ type: 'picklist', options: ['A', 'B'] }), modelValue: '' },
    })
    expect(w.findComponent(RadioGroup).props('choices')).toEqual([
      { text: 'A', value: 'A' },
      { text: 'B', value: 'B' },
    ])
  })

  it('double type TextField receives imaskProps with numeric mask', () => {
    const w = mount(QuestionField, {
      props: { question: make({ type: 'double' }), modelValue: '' },
    })
    expect(w.findComponent(TextField).props('imaskProps')).toEqual({ mask: Number })
  })
})

describe('QuestionField update:modelValue emissions', () => {
  it('emits new value from TextField for string type', async () => {
    const w = mount(QuestionField, {
      props: { question: make({ type: 'string' }), modelValue: '' },
    })
    await w.findComponent(TextField).vm.$emit('update:modelValue', 'hello')
    expect(w.emitted('update:modelValue')?.[0]?.[0]).toBe('hello')
  })

  it('emits new value from RadioGroup for small picklist', async () => {
    const w = mount(QuestionField, {
      props: { question: make({ type: 'picklist', options: ['A', 'B'] }), modelValue: '' },
    })
    await w.findComponent(RadioGroup).vm.$emit('update:modelValue', 'B')
    expect(w.emitted('update:modelValue')?.[0]?.[0]).toBe('B')
  })

  it('emits semicolon-joined values for multipicklist', async () => {
    const w = mount(QuestionField, {
      props: {
        question: make({ type: 'multipicklist', options: ['A', 'B', 'C'] }),
        modelValue: '',
      },
    })
    await w.findComponent(CheckboxGroup).vm.$emit('update:modelValue', ['A', 'C'])
    const emitted = w.emitted('update:modelValue')?.[0]?.[0] as string
    expect(typeof emitted).toBe('string')
    expect(emitted.split(';').sort()).toEqual(['A', 'C'])
  })

  it('parses existing semicolon-joined modelValue into array for CheckboxGroup', () => {
    const w = mount(QuestionField, {
      props: {
        question: make({ type: 'multipicklist', options: ['A', 'B', 'C'] }),
        modelValue: 'A;B',
      },
    })
    expect(w.findComponent(CheckboxGroup).props('modelValue')).toEqual(['A', 'B'])
  })

  it('emits "true"/"false" strings for Switch', async () => {
    const w = mount(QuestionField, {
      props: { question: make({ type: 'boolean' }), modelValue: 'false' },
    })
    await w.findComponent(Switch).vm.$emit('update:modelValue', 'true')
    expect(w.emitted('update:modelValue')?.[0]?.[0]).toBe('true')
  })

  it('emits value from DateField', async () => {
    const w = mount(QuestionField, {
      props: { question: make({ type: 'date' }), modelValue: '' },
    })
    await w.findComponent(DateField).vm.$emit('update:modelValue', '2025-01-15')
    expect(w.emitted('update:modelValue')?.[0]?.[0]).toBe('2025-01-15')
  })

  it('emits from native textarea input event', async () => {
    const w = mount(QuestionField, {
      props: { question: make({ type: 'textarea' }), modelValue: '' },
    })
    await w.find('textarea').setValue('some text')
    expect(w.emitted('update:modelValue')?.[0]?.[0]).toBe('some text')
  })

  it('emits from native select change event', async () => {
    const w = mount(QuestionField, {
      props: {
        question: make({ type: 'picklist', options: ['A', 'B', 'C', 'D', 'E'] }),
        modelValue: '',
      },
    })
    await w.find('select').setValue('C')
    expect(w.emitted('update:modelValue')?.[0]?.[0]).toBe('C')
  })
})
