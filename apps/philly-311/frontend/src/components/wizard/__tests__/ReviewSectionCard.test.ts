// ABOUTME: Tests for ReviewSectionCard — the checkmark/icon/label header, the Edit
// ABOUTME: button's destination and aria-label, and the default-slot content.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { IconFolder } from '@phila/phila-ui-core/icons'
import ReviewSectionCard from '../ReviewSectionCard.vue'

function mountCard(slotText = 'content') {
  return mount(ReviewSectionCard, {
    props: {
      icon: IconFolder,
      label: 'Issue type',
      editTo: '/report/issue-type',
      editLabel: 'Edit issue type',
    },
    slots: { default: slotText },
  })
}

describe('ReviewSectionCard', () => {
  it('renders the section heading', () => {
    expect(mountCard().find('.review-section-card__heading').text()).toBe('Issue type')
  })

  it('renders the default slot content', () => {
    expect(mountCard('Illegal dumping').text()).toContain('Illegal dumping')
  })

  it("links Edit to the section's owning step with an aria-label", () => {
    const w = mountCard()
    const edit = w.find('a')
    expect(edit.attributes('href')).toBe('/report/issue-type')
    expect(edit.attributes('aria-label')).toBe('Edit issue type')
    expect(edit.text()).toContain('Edit')
  })

  it('emits edit instead of navigating when no editTo is given', async () => {
    const w = mount(ReviewSectionCard, {
      props: {
        icon: IconFolder,
        label: 'Visibility',
        editLabel: 'Edit visibility and contact info',
      },
    })
    expect(w.find('a').exists()).toBe(false)
    const edit = w.find('button')
    expect(edit.attributes('aria-label')).toBe('Edit visibility and contact info')
    await edit.trigger('click')
    expect(w.emitted('edit')).toHaveLength(1)
  })
})
