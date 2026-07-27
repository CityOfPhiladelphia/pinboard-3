// ABOUTME: Tests for FeaturedArticles — featured query params, card links,
// ABOUTME: and hiding the strip entirely on empty or failed fetches.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import FeaturedArticles from '../FeaturedArticles.vue'

const { loadArticles } = vi.hoisted(() => ({ loadArticles: vi.fn() }))

vi.mock('@/composables/useKnowledgeArticles', () => ({
  useKnowledgeArticles: () => ({ loadArticles, loadArticle: vi.fn() }),
}))

const a = (id: string, lastPublishedAt?: string) => ({
  id,
  title: `Article ${id}`,
  lastPublishedAt,
})

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

  it('caps at the four newest even when the server over-returns unsorted items', async () => {
    // The API's list-view branch ignores sort/direction/limit and returns the
    // whole Salesforce list view; the client must enforce "newest 4" itself.
    loadArticles.mockResolvedValueOnce({
      items: [
        a('old', '2025-01-01T00:00:00Z'),
        a('newest', '2026-06-01T00:00:00Z'),
        a('oldest', '2024-01-01T00:00:00Z'),
        a('new', '2026-05-01T00:00:00Z'),
        a('mid', '2025-06-01T00:00:00Z'),
      ],
      nextPageToken: undefined,
    })
    const w = mountStrip()
    await flushPromises()
    const links = w.findAllComponents(RouterLinkStub)
    expect(links.map((l) => l.props('to'))).toEqual([
      '/answers/newest',
      '/answers/new',
      '/answers/mid',
      '/answers/old',
    ])
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
