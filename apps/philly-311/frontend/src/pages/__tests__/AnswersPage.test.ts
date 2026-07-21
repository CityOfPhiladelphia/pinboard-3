// ABOUTME: Tests for AnswersPage — initial browse list, Load more pagination,
// ABOUTME: debounced server-side search, clear-query reload, error/empty states.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import AnswersPage from '../AnswersPage.vue'

const { loadArticles } = vi.hoisted(() => ({ loadArticles: vi.fn() }))

vi.mock('@/composables/useKnowledgeArticles', () => ({
  useKnowledgeArticles: () => ({ loadArticles, loadArticle: vi.fn() }),
}))

const a = (id: string) => ({ id, title: `Article ${id}` })

function mountPage() {
  return mount(AnswersPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

beforeEach(() => {
  vi.useFakeTimers()
  loadArticles.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('AnswersPage', () => {
  it('loads and renders the first page of articles', async () => {
    loadArticles.mockResolvedValueOnce({ items: [a('1'), a('2')], nextPageToken: '25' })
    const w = mountPage()
    await flushPromises()
    expect(loadArticles).toHaveBeenCalledWith({})
    expect(w.text()).toContain('Article 1')
    expect(w.text()).toContain('Article 2')
    expect(w.find('[data-test="answers-more"]').exists()).toBe(true)
  })

  it('Load more appends the next page and hides at the end', async () => {
    loadArticles.mockResolvedValueOnce({ items: [a('1')], nextPageToken: '25' })
    const w = mountPage()
    await flushPromises()
    loadArticles.mockResolvedValueOnce({ items: [a('2')], nextPageToken: undefined })
    await w.find('[data-test="answers-more"]').trigger('click')
    await flushPromises()
    expect(loadArticles).toHaveBeenLastCalledWith({ nextPageToken: '25' })
    expect(w.text()).toContain('Article 1')
    expect(w.text()).toContain('Article 2')
    expect(w.find('[data-test="answers-more"]').exists()).toBe(false)
  })

  it('a typed query runs a server-side search that replaces the list', async () => {
    loadArticles.mockResolvedValueOnce({ items: [a('1')], nextPageToken: '25' })
    const w = mountPage()
    await flushPromises()
    loadArticles.mockResolvedValueOnce({ items: [a('9')], nextPageToken: undefined })
    await w.find('input[type="search"]').setValue('pothole')
    vi.advanceTimersByTime(250)
    await flushPromises()
    expect(loadArticles).toHaveBeenLastCalledWith({ search: 'pothole' })
    expect(w.text()).toContain('Article 9')
    expect(w.text()).not.toContain('Article 1')
    expect(w.find('[data-test="answers-more"]').exists()).toBe(false)
  })

  it('clearing the query reloads the first browse page', async () => {
    loadArticles.mockResolvedValueOnce({ items: [a('1')], nextPageToken: undefined })
    const w = mountPage()
    await flushPromises()
    loadArticles.mockResolvedValueOnce({ items: [a('9')], nextPageToken: undefined })
    await w.find('input[type="search"]').setValue('pothole')
    vi.advanceTimersByTime(250)
    await flushPromises()
    loadArticles.mockResolvedValueOnce({ items: [a('1'), a('2')], nextPageToken: undefined })
    await w.find('input[type="search"]').setValue('')
    await flushPromises()
    expect(loadArticles).toHaveBeenLastCalledWith({})
    expect(w.text()).toContain('Article 2')
  })

  it('shows a search-specific empty state', async () => {
    loadArticles.mockResolvedValueOnce({ items: [a('1')], nextPageToken: undefined })
    const w = mountPage()
    await flushPromises()
    loadArticles.mockResolvedValueOnce({ items: [], nextPageToken: undefined })
    await w.find('input[type="search"]').setValue('zebra')
    vi.advanceTimersByTime(250)
    await flushPromises()
    expect(w.text()).toContain('No articles match')
  })

  it('shows the generic empty state when the list is empty', async () => {
    loadArticles.mockResolvedValueOnce({ items: [], nextPageToken: undefined })
    const w = mountPage()
    await flushPromises()
    expect(w.text()).toContain('No articles available.')
  })

  it('surfaces load errors via role=alert', async () => {
    loadArticles.mockRejectedValueOnce(new Error('boom'))
    const w = mountPage()
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toContain('boom')
  })

  it('a successful search renders results even after the initial browse failed', async () => {
    loadArticles.mockRejectedValueOnce(new Error('boom'))
    const w = mountPage()
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(true)
    loadArticles.mockResolvedValueOnce({ items: [a('9')], nextPageToken: undefined })
    await w.find('input[type="search"]').setValue('pothole')
    vi.advanceTimersByTime(250)
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(false)
    expect(w.text()).toContain('Article 9')
  })
})
