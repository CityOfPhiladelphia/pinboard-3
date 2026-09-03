// ABOUTME: Tests TypeDirectory — caseType grouping, fuzzy search incl. keywords, select emit.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TypeDirectory from '../TypeDirectory.vue'
import type { ServiceType } from '@/types/api'

const st = (
  serviceType: Service,
  caseType: string,
  description = `${serviceType} desc`,
): ServiceType => ({
  serviceType,
  caseType,
  description,
  recordTypeID: 'rt',
  department: 'Dept',
  questions: [],
})
const catalog = [
  st('Pothole Repair', 'Street Defect'),
  st('Cave-In Repair', 'Street Defect', 'Road surface dropped suddenly'),
  st('ADA Curb Ramp', 'Dangerous Sidewalk'),
  st('Graffiti Removal', 'Graffiti Removal'),
]

describe('TypeDirectory', () => {
  it('groups by caseType with groups and members sorted A–Z', () => {
    const w = mount(TypeDirectory, { props: { catalog } })
    const headings = w.findAll('h3').map((h) => h.text())
    expect(headings).toEqual(['Dangerous Sidewalk', 'Graffiti Removal', 'Street Defect'])
    const streetDefect = w.findAll('li button').map((b) => b.text())
    expect(streetDefect.join(' ')).toContain('Cave-In Repair')
    expect(w.text()).toContain('Pothole Repair desc')
    expect(w.text()).toContain('Road surface dropped suddenly')
    const names = w.findAll('li button').map((b) => b.text())
    const caveIdx = names.findIndex((t) => t.includes('Cave-In Repair'))
    const potholeIdx = names.findIndex((t) => t.includes('Pothole Repair'))
    expect(caveIdx).toBeGreaterThanOrEqual(0)
    expect(caveIdx).toBeLessThan(potholeIdx)
  })
  it('filters by fuzzy match on name and drops emptied groups', async () => {
    const w = mount(TypeDirectory, { props: { catalog } })
    await w.find('input[type="search"]').setValue('pothole')
    expect(w.text()).toContain('Pothole Repair')
    expect(w.text()).not.toContain('Graffiti Removal')
    expect(w.findAll('h3').map((h) => h.text())).toEqual(['Street Defect'])
  })
  it('matches via keywords from service_types.json', async () => {
    const w = mount(TypeDirectory, { props: { catalog } })
    await w.find('input[type="search"]').setValue('wheelchair')
    expect(w.text()).toContain('ADA Curb Ramp')
    expect(w.text()).not.toContain('Pothole Repair')
  })
  it('matches on description substrings', async () => {
    const w = mount(TypeDirectory, { props: { catalog } })
    await w.find('input[type="search"]').setValue('dropped suddenly')
    expect(w.text()).toContain('Cave-In Repair')
    expect(w.text()).not.toContain('Pothole Repair')
  })
  it('shows an empty message when nothing matches', async () => {
    const w = mount(TypeDirectory, { props: { catalog } })
    expect(w.find('[role="status"]').exists()).toBe(true)
    expect(w.find('[role="status"]').text()).toBe('')
    await w.find('input[type="search"]').setValue('zzzzz')
    expect(w.find('[role="status"]').exists()).toBe(true)
    expect(w.text()).toContain('No issue types match your search.')
    expect(w.findAll('h3')).toHaveLength(0)
  })
  it('emits select with the service type on row click', async () => {
    const w = mount(TypeDirectory, { props: { catalog } })
    const rows = w.findAll('li button').filter((b) => b.text().includes('Graffiti Removal'))
    expect(rows).toHaveLength(1)
    await rows[0].trigger('click')
    expect(w.emitted('select')?.[0]).toEqual(['Graffiti Removal'])
  })
})
