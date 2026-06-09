import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import TrendingArticles from './TrendingArticles.vue'

const global = { stubs: { RouterLink: RouterLinkStub } }

describe('TrendingArticles', () => {
  it('renders a card per article linking to /answers/:id', () => {
    const articles = [
      { id: 'a1', title: 'Pothole help' },
      { id: 'a2', title: 'Trash days' },
    ]
    const w = mount(TrendingArticles, { props: { articles }, global })
    const links = w.findAllComponents(RouterLinkStub)
    expect(links).toHaveLength(2)
    expect(links[0].props('to')).toBe('/answers/a1')
    expect(w.text()).toContain('Pothole help')
  })
  it('renders nothing when there are no articles', () => {
    const w = mount(TrendingArticles, { props: { articles: [] }, global })
    expect(w.findAllComponents(RouterLinkStub)).toHaveLength(0)
    expect(w.find('.trending').exists()).toBe(false)
  })
})
