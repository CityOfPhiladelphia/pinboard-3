// ABOUTME: Tests for AnswerDetailPage — load by id, 404/error/no-body states,
// ABOUTME: id-change reload, and the unconditional Start a report CTA.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import AnswerDetailPage from './AnswerDetailPage.vue'
import { ApiError } from '@/composables/useApiError'

const { loadArticle } = vi.hoisted(() => ({ loadArticle: vi.fn() }))

vi.mock('@/composables/useKnowledgeArticles', () => ({
  useKnowledgeArticles: () => ({ loadArticle, loadArticles: vi.fn() }),
}))

const Stub = { template: '<div />' }

function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/answers', component: Stub },
      { path: '/answers/:id', component: AnswerDetailPage },
      { path: '/report', component: Stub },
    ],
  })
}

async function mountAt(id: string) {
  const router = makeRouter()
  await router.push(`/answers/${id}`)
  await router.isReady()
  const w = mount(AnswerDetailPage, { global: { plugins: [router] } })
  await flushPromises()
  return { w, router }
}

beforeEach(() => {
  loadArticle.mockReset()
})

describe('AnswerDetailPage', () => {
  it('renders the article title and sanitized body', async () => {
    loadArticle.mockResolvedValueOnce({
      id: 'kA1',
      title: 'Pothole repair',
      body: '<p>Call <strong>311</strong></p><script>bad()</script>',
    })
    const { w } = await mountAt('kA1')
    expect(loadArticle).toHaveBeenCalledWith('kA1')
    expect(w.find('h1').text()).toBe('Pothole repair')
    expect(w.html()).toContain('<strong>311</strong>')
    expect(w.html()).not.toContain('script')
  })

  it('always offers a Start a report CTA to /report', async () => {
    loadArticle.mockResolvedValueOnce({ id: 'kA1', title: 'T', body: '<p>x</p>' })
    const { w } = await mountAt('kA1')
    const cta = w.find('[data-test="answer-cta"]')
    expect(cta.exists()).toBe(true)
    expect(cta.attributes('href')).toBe('/report')
  })

  it('shows a not-found state on 404', async () => {
    loadArticle.mockResolvedValueOnce(null)
    const { w } = await mountAt('missing')
    expect(w.text()).toContain('Article not found')
    expect(w.find('h1').text()).toBe('Article not found')
  })

  it('surfaces 5xx errors via role=alert', async () => {
    loadArticle.mockRejectedValueOnce(new ApiError(500, 'server down'))
    const { w } = await mountAt('kA1')
    expect(w.find('[role="alert"]').text()).toContain('server down')
  })

  it('falls back gracefully when the article has no body', async () => {
    loadArticle.mockResolvedValueOnce({ id: 'kA1', title: 'T' })
    const { w } = await mountAt('kA1')
    expect(w.text()).toContain("doesn't have any content yet")
  })

  it('re-loads when the route id changes', async () => {
    loadArticle.mockResolvedValueOnce({ id: 'kA1', title: 'First', body: '<p>1</p>' })
    const { w, router } = await mountAt('kA1')
    loadArticle.mockResolvedValueOnce({ id: 'kA2', title: 'Second', body: '<p>2</p>' })
    await router.push('/answers/kA2')
    await flushPromises()
    expect(loadArticle).toHaveBeenLastCalledWith('kA2')
    expect(w.find('h1').text()).toBe('Second')
  })
})
