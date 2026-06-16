// ABOUTME: Tests for StepIndicator — verifies step rendering, active state marking,
// and click-to-navigate behavior for completed wizard steps.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StepIndicator from '../StepIndicator.vue'

const steps = [
  { title: 'Image', path: '/report' },
  { title: 'Issue type', path: '/report/issue-type' },
  { title: 'Location', path: '/report/location' },
]

describe('StepIndicator', () => {
  it('renders all steps with the current one marked', () => {
    const w = mount(StepIndicator, { props: { steps, currentStep: 2, completedThrough: 1 } })
    expect(w.findAll('li')).toHaveLength(3)
    expect(w.text()).toContain('Issue type')
    expect(w.find('[data-state="current"]').text()).toContain('Issue type')
    expect(w.find('[data-state="done"]').text()).toContain('Image')
  })
  it('emits navigate when a completed (clickable) step is clicked', async () => {
    const w = mount(StepIndicator, { props: { steps, currentStep: 2, completedThrough: 1 } })
    await w.find('[data-state="done"] button').trigger('click')
    expect(w.emitted('navigate')?.[0]).toEqual(['/report'])
  })
  it('does not render a button for upcoming steps', () => {
    const w = mount(StepIndicator, { props: { steps, currentStep: 2, completedThrough: 1 } })
    expect(w.find('[data-state="upcoming"] button').exists()).toBe(false)
  })
})
