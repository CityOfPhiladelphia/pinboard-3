// ABOUTME: Tests for StatTile — generic value/label/tone stat card.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatTile from '../StatTile.vue'

describe('StatTile', () => {
  it('renders the value and label', () => {
    const w = mount(StatTile, { props: { value: 21, label: 'Total' } })
    expect(w.find('.stat-tile__value').text()).toBe('21')
    expect(w.find('.stat-tile__label').text()).toBe('Total')
  })
  it('applies the tone modifier class', () => {
    const w = mount(StatTile, { props: { value: 5, label: 'Resolved', tone: 'success' } })
    expect(w.find('.stat-tile__value').classes()).toContain('stat-tile__value--success')
    expect(w.find('.stat-tile__label').classes()).toContain('stat-tile__label--success')
  })
  it('defaults to the neutral tone', () => {
    const w = mount(StatTile, { props: { value: 0, label: 'Total' } })
    expect(w.find('.stat-tile__value').classes()).toContain('stat-tile__value--neutral')
  })
})
