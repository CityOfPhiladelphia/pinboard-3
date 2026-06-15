// ABOUTME: Tests for ArticleCard — title rendering and link target.
import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import ArticleCard from './ArticleCard.vue'

const article = { id: 'kA123', title: 'How do I report a pothole?' }

describe('ArticleCard', () => {
  it('renders the article title', () => {
    const w = mount(ArticleCard, {
      props: { article },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(w.text()).toContain('How do I report a pothole?')
  })

  it('links to the article detail page', () => {
    const w = mount(ArticleCard, {
      props: { article },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(w.findComponent(RouterLinkStub).props('to')).toBe('/answers/kA123')
  })
})
