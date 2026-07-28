// ABOUTME: Tests for ClusterBadge — count display, aria-label, size-tier classes, click emit.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ClusterBadge from '../ClusterBadge.vue'

describe('ClusterBadge', () => {
  it('renders the count', () => {
    const w = mount(ClusterBadge, { props: { count: 5 } })
    expect(w.text()).toContain('5')
  })

  it('has an aria-label describing the count and zoom-in action', () => {
    const w = mount(ClusterBadge, { props: { count: 42 } })
    expect(w.find('button').attributes('aria-label')).toBe('42 reports — zoom in')
  })

  it('applies --sm class for count < 10', () => {
    const w = mount(ClusterBadge, { props: { count: 7 } })
    expect(w.find('button').classes()).toContain('cluster-badge--sm')
    expect(w.find('button').classes()).not.toContain('cluster-badge--md')
    expect(w.find('button').classes()).not.toContain('cluster-badge--lg')
  })

  it('applies --md class for count between 10 and 99', () => {
    const w = mount(ClusterBadge, { props: { count: 50 } })
    expect(w.find('button').classes()).toContain('cluster-badge--md')
  })

  it('applies --lg class for count >= 100', () => {
    const w = mount(ClusterBadge, { props: { count: 250 } })
    expect(w.find('button').classes()).toContain('cluster-badge--lg')
  })

  it('emits click when clicked', async () => {
    const w = mount(ClusterBadge, { props: { count: 5 } })
    await w.find('button').trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
  })
})
