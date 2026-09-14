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

// FeaturedArticles is stubbed so its own fetch doesn't consume the queued
// loadArticles mocks; it has dedicated tests in components/answers/__tests__.
function mountPage() {
  return mount(AnswersPage, {
    global: { stubs: { RouterLink: RouterLinkStub, FeaturedArticles: true } },
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  loadArticles.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('AnswersPage', () => {
  it('renders the hero banner with a decorative photo and no breadcrumb', async () => {
    loadArticles.mockResolvedValueOnce({ items: [], nextPageToken: undefined })
    const w = mountPage()
    await flushPromises()
    const hero = w.find('.answers__hero')
    expect(hero.exists()).toBe(true)
    expect(hero.find('img[alt=""]').exists()).toBe(true)
    expect(hero.find('h1').text()).toBe('Answers')
    expect(w.find('[aria-label="Breadcrumb"]').exists()).toBe(false)
  })

  it('passes the Figma placeholder and the natural-language label/icon to Search', async () => {
    loadArticles.mockResolvedValueOnce({ items: [], nextPageToken: undefined })
    const w = mountPage()
    await flushPromises()
    const search = w.findComponent({ name: 'Search' })
    expect(search.props('placeholder')).toBe('Search by topic or keyword')
    expect(search.props('label')).toBe('Use natural language to search phila.gov')
    expect(search.props('labelIcon')).toBeTruthy()
  })

  it('mounts the featured-articles strip below the hero', async () => {
    loadArticles.mockResolvedValueOnce({ items: [], nextPageToken: undefined })
    const w = mountPage()
    await flushPromises()
    expect(w.find('featured-articles-stub').exists()).toBe(true)
  })

  it('loads and renders the first page of articles, newest first by default', async () => {
    loadArticles.mockResolvedValueOnce({ items: [a('1'), a('2')], nextPageToken: '25' })
    const w = mountPage()
    await flushPromises()
    // Matches the mobile apps' default browse order.
    expect(loadArticles).toHaveBeenCalledWith({ sort: 'lastPublishedAt', direction: 'desc' })
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
    expect(loadArticles).toHaveBeenLastCalledWith({
      nextPageToken: '25',
      sort: 'lastPublishedAt',
      direction: 'desc',
    })
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
    // The AbortSignal lets a later keystroke's search cancel this one's request.
    expect(loadArticles).toHaveBeenLastCalledWith({
      search: 'pothole',
      signal: expect.any(AbortSignal),
    })
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
    expect(loadArticles).toHaveBeenLastCalledWith({ sort: 'lastPublishedAt', direction: 'desc' })
    expect(w.text()).toContain('Article 2')
  })

  it('choosing a sort order reloads the browse list with sort and direction', async () => {
    loadArticles.mockResolvedValueOnce({ items: [a('1')], nextPageToken: undefined })
    const w = mountPage()
    await flushPromises()
    loadArticles.mockResolvedValueOnce({ items: [a('2')], nextPageToken: undefined })
    await w.find('[data-test="answers-sort"] [data-choice="title:asc"]').trigger('click')
    await flushPromises()
    expect(loadArticles).toHaveBeenLastCalledWith({
      sort: 'title',
      direction: 'asc',
    })
  })

  it('Load more keeps the chosen sort order', async () => {
    loadArticles.mockResolvedValueOnce({ items: [a('1')], nextPageToken: undefined })
    const w = mountPage()
    await flushPromises()
    loadArticles.mockResolvedValueOnce({ items: [a('2')], nextPageToken: '25' })
    await w.find('[data-test="answers-sort"] [data-choice="title:asc"]').trigger('click')
    await flushPromises()
    loadArticles.mockResolvedValueOnce({ items: [a('3')], nextPageToken: undefined })
    await w.find('[data-test="answers-more"]').trigger('click')
    await flushPromises()
    expect(loadArticles).toHaveBeenLastCalledWith({
      nextPageToken: '25',
      sort: 'title',
      direction: 'asc',
    })
  })

  it('applies the default newest-first order without marking any sort choice selected', async () => {
    loadArticles.mockResolvedValueOnce({ items: [a('1')], nextPageToken: undefined })
    const w = mountPage()
    await flushPromises()
    const choices = w.findAll('[data-test="answers-sort"] [data-choice]')
    expect(choices.length).toBeGreaterThan(0)
    expect(choices.every((c) => c.attributes('aria-pressed') === 'false')).toBe(true)
  })

  it('marks the chosen sort option selected once the user picks one', async () => {
    loadArticles.mockResolvedValueOnce({ items: [a('1')], nextPageToken: undefined })
    const w = mountPage()
    await flushPromises()
    loadArticles.mockResolvedValueOnce({ items: [a('2')], nextPageToken: undefined })
    await w.find('[data-test="answers-sort"] [data-choice="title:asc"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-choice="title:asc"]').attributes('aria-pressed')).toBe('true')
  })

  it('resets to the unselected default, reloading with it when the sort had changed', async () => {
    loadArticles.mockResolvedValueOnce({ items: [a('1')], nextPageToken: undefined })
    const w = mountPage()
    await flushPromises()
    loadArticles.mockResolvedValueOnce({ items: [a('2')], nextPageToken: undefined })
    await w.find('[data-test="answers-sort"] [data-choice="title:asc"]').trigger('click')
    await flushPromises()
    loadArticles.mockResolvedValueOnce({ items: [a('3')], nextPageToken: undefined })
    await w.find('[data-test="answers-sort"] [data-choice-reset]').trigger('click')
    await flushPromises()
    expect(loadArticles).toHaveBeenLastCalledWith({ sort: 'lastPublishedAt', direction: 'desc' })
    expect(w.find('[data-choice="title:asc"]').attributes('aria-pressed')).toBe('false')
  })

  it('hides the sort control during an active search', async () => {
    loadArticles.mockResolvedValueOnce({ items: [a('1')], nextPageToken: undefined })
    const w = mountPage()
    await flushPromises()
    expect(w.find('[data-test="answers-sort"]').exists()).toBe(true)
    loadArticles.mockResolvedValueOnce({ items: [a('9')], nextPageToken: undefined })
    await w.find('input[type="search"]').setValue('pothole')
    vi.advanceTimersByTime(250)
    await flushPromises()
    expect(w.find('[data-test="answers-sort"]').exists()).toBe(false)
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
