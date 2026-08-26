// ABOUTME: Tests for ServiceTypeCard — icon/color now come from the same
// ABOUTME: serviceTypeIconComponent/serviceTypeColor used by cards and map pins.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ServiceTypeCard from '../ServiceTypeCard.vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { serviceTypeIconComponent } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'

beforeEach(() => {
  setActivePinia(createPinia())
})

function mountCard(serviceType = 'Pothole Repair') {
  return mount(ServiceTypeCard, { props: { serviceType, description: 'A pothole' } })
}

describe('ServiceTypeCard', () => {
  it('renders a ServiceTypeIcon sharing the same icon/color the cards and map pins use', () => {
    const w = mountCard('Pothole Repair')
    const icon = w.findComponent({ name: 'ServiceTypeIcon' })
    expect(icon.exists()).toBe(true)
    expect(icon.props('serviceType')).toBe('Pothole Repair')
    // Sanity: ServiceTypeIcon itself resolves the same functions cards/pins use.
    expect(serviceTypeIconComponent('Pothole Repair')).toBeTruthy()
    expect(serviceTypeColor('Pothole Repair')).toBe('#99591a')
  })

  it('shows the service type name and description', () => {
    const w = mountCard('Pothole Repair')
    expect(w.text()).toContain('Pothole Repair')
    expect(w.text()).toContain('A pothole')
  })

  it('selects on click, emitting the service type', async () => {
    const w = mountCard('Graffiti Removal')
    await w.find('summary').trigger('click')
    expect(w.emitted('update:selected')?.[0]).toEqual(['Graffiti Removal'])
  })

  it('shows a checkmark only when this card matches the store category', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Graffiti Removal')
    const w = mountCard('Graffiti Removal')
    expect(w.find('.selected-check').exists()).toBe(true)

    const other = mountCard('Pothole Repair')
    expect(other.find('.selected-check').exists()).toBe(false)
  })

  // Clicking a <summary> natively toggles its <details> open, independent of any
  // :open binding (the binding here is always false, so Vue never re-applies it
  // once the browser's native toggle has fired) — that would make the description
  // permanently visible after the first click. This card only selects; it never
  // expands, so repeated clicks must never leave `open` set.
  it('never opens on click — only the CaseTypeCard grouping expands', async () => {
    const w = mountCard()
    await w.find('summary').trigger('click')
    expect(w.find('details').attributes('open')).toBeUndefined()
    await w.find('summary').trigger('click')
    expect(w.find('details').attributes('open')).toBeUndefined()
  })
})
