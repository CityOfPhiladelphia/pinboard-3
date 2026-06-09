import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Article } from '@/composables/useKnowledgeArticles'

const loadArticles = vi.fn()
vi.mock('@/composables/useKnowledgeArticles', () => ({
  useKnowledgeArticles: () => ({ loadArticles }),
}))

import { useTrendingArticles } from './useTrendingArticles'

const sample: Article[] = [
  { id: 'a1', title: 'How to report a pothole' },
  { id: 'a2', title: 'Trash pickup schedule' },
]

beforeEach(() => loadArticles.mockReset())

describe('useTrendingArticles', () => {
  it('loads the top-N articles (unwrapping .items)', async () => {
    loadArticles.mockResolvedValue({ items: sample })
    const t = useTrendingArticles()
    await t.init()
    expect(loadArticles).toHaveBeenCalledWith({ pageSize: 5 })
    expect(t.articles.value).toEqual(sample)
    expect(t.error.value).toBeNull()
  })
  it('resolves to an empty list on failure (no throw)', async () => {
    loadArticles.mockRejectedValueOnce(new Error('boom'))
    const t = useTrendingArticles()
    await t.init()
    expect(t.articles.value).toEqual([])
    expect(t.error.value).toBeInstanceOf(Error)
  })
})
