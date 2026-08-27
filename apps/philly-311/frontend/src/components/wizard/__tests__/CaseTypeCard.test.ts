// ABOUTME: Tests for CaseTypeCard — the caseType-grouping heading (generic marker icon,
// ABOUTME: since a case type spans several service types) plus its ServiceTypeCard children.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CaseTypeCard from '../CaseTypeCard.vue'
import type { ServiceType } from '@/types/api'

beforeEach(() => {
  setActivePinia(createPinia())
})

function st(serviceType: string, description = `${serviceType} desc`): ServiceType {
  return {
    serviceType,
    caseType: 'Street Defect',
    description,
    recordTypeID: 'rt',
    department: 'Dept',
    questions: [],
  }
}

describe('CaseTypeCard', () => {
  it('renders one ServiceTypeCard per member, plus the caseType heading', () => {
    const w = mount(CaseTypeCard, {
      props: {
        caseType: 'Street Defect',
        serviceTypes: [st('Pothole Repair'), st('Cave-In Repair', 'Road surface dropped')],
      },
    })
    expect(w.text()).toContain('Street Defect')
    const cards = w.findAllComponents({ name: 'ServiceTypeCard' })
    expect(cards).toHaveLength(2)
    expect(cards.map((c) => c.props('serviceType'))).toEqual(['Pothole Repair', 'Cave-In Repair'])
  })

  it('forwards v-model:selected down to its ServiceTypeCard children', async () => {
    const w = mount(CaseTypeCard, {
      props: {
        caseType: 'Street Defect',
        serviceTypes: [st('Pothole Repair')],
      },
    })
    await w.findComponent({ name: 'ServiceTypeCard' }).find('summary').trigger('click')
    expect(w.emitted('update:selected')?.[0]).toEqual(['Pothole Repair'])
  })
})
