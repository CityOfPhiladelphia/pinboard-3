// ABOUTME: Tests for FeaturedArticles — featured query params, card links,
// ABOUTME: and hiding the strip entirely on empty or failed fetches.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import FeaturedArticles from '../FeaturedArticles.vue'

const { loadArticles } = vi.hoisted(() => ({ loadArticles: vi.fn() }))

vi.mock('@/composables/useKnowledgeArticles', () => ({
  useKnowledgeArticles: () => ({ loadArticles, loadArticle: vi.fn() }),
}))

const a = (id: string) => ({ id, title: `Article ${id}` })

function mountStrip() {
  return mount(FeaturedArticles, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

beforeEach(() => {
  loadArticles.mockReset()
})

describe('FeaturedArticles', () => {
  it('fetches the four newest featured articles', async () => {
    loadArticles.mockResolvedValueOnce({ items: [a('1')], nextPageToken: undefined })
    mountStrip()
    await flushPromises()
    expect(loadArticles).toHaveBeenCalledWith({
      list: 'featured',
      sort: 'lastPublishedAt',
      direction: 'desc',
      limit: 4,
    })
  })

  it('renders a card per article linking to its detail page', async () => {
    loadArticles.mockResolvedValueOnce({ items: [a('1'), a('2')], nextPageToken: undefined })
    const w = mountStrip()
    await flushPromises()
    const links = w.findAllComponents(RouterLinkStub)
    expect(links).toHaveLength(2)
    expect(links[0].props('to')).toBe('/answers/1')
    expect(w.text()).toContain('Article 1')
    expect(w.text()).toContain('Article 2')
  })

  it('renders nothing when the featured list is empty', async () => {
    loadArticles.mockResolvedValueOnce({ items: [], nextPageToken: undefined })
    const w = mountStrip()
    await flushPromises()
    expect(w.find('*').exists()).toBe(false)
  })

  it('renders nothing when the featured fetch fails', async () => {
    loadArticles.mockRejectedValueOnce(new Error('boom'))
    const w = mountStrip()
    await flushPromises()
    expect(w.find('*').exists()).toBe(false)
  })
})
