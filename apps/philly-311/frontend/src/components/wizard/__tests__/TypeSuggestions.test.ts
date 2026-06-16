// ABOUTME: Tests TypeSuggestions — confidence sort, catalog filter, top-3 cap, select emit.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TypeSuggestions from '../TypeSuggestions.vue'
import type { ServiceType } from '@/types/api'

const st = (serviceType: string, description = `${serviceType} desc`): ServiceType => ({
  serviceType,
  caseType: serviceType,
  description,
  recordTypeID: 'rt',
  department: 'Dept',
  questions: [],
})
const catalog = [
  st('Pothole Repair'),
  st('Illegal Dumping'),
  st('Graffiti Removal'),
  st('Vacant Lot'),
]

describe('TypeSuggestions', () => {
  it('renders suggestions sorted by confidence, capped at 3, unknown types dropped', () => {
    const w = mount(TypeSuggestions, {
      props: {
        suggestions: [
          { serviceType: 'Graffiti Removal', confidence: 0.5 },
          { serviceType: 'Miscellaneous', confidence: 0.95 },
          { serviceType: 'Pothole Repair', confidence: 0.9 },
          { serviceType: 'Illegal Dumping', confidence: 0.8 },
          { serviceType: 'Vacant Lot', confidence: 0.4 },
        ],
        catalog,
      },
    })
    const items = w.findAll('button')
    expect(items).toHaveLength(3)
    expect(items[0].text()).toContain('Pothole Repair')
    expect(items[1].text()).toContain('Illegal Dumping')
    expect(items[2].text()).toContain('Graffiti Removal')
    expect(w.text()).not.toContain('Miscellaneous')
    expect(w.text()).toContain('AI generated recommendations')
    expect(items[0].text()).toContain('Pothole Repair desc')
  })
  it('emits select with the service type on click', async () => {
    const w = mount(TypeSuggestions, {
      props: { suggestions: [{ serviceType: 'Pothole Repair', confidence: 0.9 }], catalog },
    })
    await w.find('button').trigger('click')
    expect(w.emitted('select')?.[0]).toEqual(['Pothole Repair'])
  })
  it('dedupes duplicate serviceTypes, keeping highest confidence order', () => {
    const w = mount(TypeSuggestions, {
      props: {
        suggestions: [
          { serviceType: 'Pothole Repair', confidence: 0.9 },
          { serviceType: 'Pothole Repair', confidence: 0.7 },
          { serviceType: 'Illegal Dumping', confidence: 0.8 },
        ],
        catalog,
      },
    })
    const items = w.findAll('button')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toContain('Pothole Repair')
    expect(items[1].text()).toContain('Illegal Dumping')
  })
  it('renders nothing when no suggestion survives the catalog filter', () => {
    const w = mount(TypeSuggestions, {
      props: { suggestions: [{ serviceType: 'Miscellaneous', confidence: 1 }], catalog },
    })
    expect(w.find('section').exists()).toBe(false)
  })
})
