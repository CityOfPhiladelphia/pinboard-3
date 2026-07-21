// ABOUTME: Tests for ServiceTypeIcon — disc color + icon from serviceType, size prop,
// ABOUTME: and aria-hidden decorative glyph.
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/utils/serviceTypeMeta', () => ({ serviceTypeColor: () => 'rgb(1, 2, 3)' }))
vi.mock('@/utils/reportIcon', () => ({
  serviceTypeIconDefinition: () => ({ iconName: 'x', prefix: 'fas' }),
}))

import ServiceTypeIcon from '../ServiceTypeIcon.vue'

describe('ServiceTypeIcon', () => {
  it('renders a disc tinted by serviceTypeColor', () => {
    const w = mount(ServiceTypeIcon, { props: { serviceType: 'Pothole' } })
    const disc = w.find('.service-type-icon')
    expect(disc.exists()).toBe(true)
    expect(disc.attributes('style')).toContain('rgb(1, 2, 3)')
  })

  it('defaults to 36px and honors the size prop', () => {
    const def = mount(ServiceTypeIcon, { props: { serviceType: 'X' } })
    expect(def.find('.service-type-icon').attributes('style')).toContain('36px')
    const small = mount(ServiceTypeIcon, { props: { serviceType: 'X', size: 32 } })
    expect(small.find('.service-type-icon').attributes('style')).toContain('32px')
  })

  it('marks the glyph decorative', () => {
    const w = mount(ServiceTypeIcon, {
      props: { serviceType: 'X' },
      global: { stubs: { FontAwesomeIcon: { template: '<svg v-bind="$attrs" />' } } },
    })
    expect(w.html()).toContain('aria-hidden')
  })
})
