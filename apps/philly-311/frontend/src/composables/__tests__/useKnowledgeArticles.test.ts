// ABOUTME: Tests for useKnowledgeArticles — list, pagination, detail, 404, and 5xx.
// ABOUTME: Uses global.fetch mock; auth is stubbed via the global setup's sso-vue mock.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useKnowledgeArticles } from '../useKnowledgeArticles'

const fetchMock = vi.fn()
global.fetch = fetchMock as unknown as typeof fetch

function okResponse(body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

function errorResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const ARTICLE_A = {
  id: '000000001',
  title: 'How to report a pothole',
  lastPublishedAt: '2026-01-01T00:00:00Z',
  url: 'report-pothole',
}
const ARTICLE_B = {
  id: '000000002',
  title: 'Noise complaints',
  lastPublishedAt: '2026-01-02T00:00:00Z',
  url: 'noise-complaints',
}

beforeEach(() => {
  fetchMock.mockReset()
})

describe('useKnowledgeArticles.loadArticles', () => {
  it('returns mapped items from a successful list response', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ articles: [ARTICLE_A, ARTICLE_B] }))
    const { loadArticles } = useKnowledgeArticles()
    const result = await loadArticles()
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toMatchObject({ id: '000000001', title: 'How to report a pothole' })
    expect(result.items[1]).toMatchObject({ id: '000000002', title: 'Noise complaints' })
  })

  it('returns undefined nextPageToken when no Link header is present', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ articles: [ARTICLE_A] }))
    const { loadArticles } = useKnowledgeArticles()
    const result = await loadArticles()
    expect(result.nextPageToken).toBeUndefined()
  })

  it('surfaces nextPageToken from Link rel="next" header', async () => {
    const linkHeader =
      '<https://api.example.test/private/key/knowledge-articles?offset=0&limit=50>; rel="first", ' +
      '<https://api.example.test/private/key/knowledge-articles?offset=50&limit=50>; rel="next"'
    fetchMock.mockResolvedValueOnce(okResponse({ articles: [ARTICLE_A] }, { Link: linkHeader }))
    const { loadArticles } = useKnowledgeArticles()
    const result = await loadArticles()
    expect(result.nextPageToken).toBe('50')
  })

  it('passes nextPageToken as offset query param on the next call', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ articles: [ARTICLE_B] }))
    const { loadArticles } = useKnowledgeArticles()
    await loadArticles({ nextPageToken: '50' })
    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(calledUrl.searchParams.get('offset')).toBe('50')
  })

  it('passes pageSize as limit query param', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ articles: [] }))
    const { loadArticles } = useKnowledgeArticles()
    await loadArticles({ pageSize: 25 })
    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(calledUrl.searchParams.get('limit')).toBe('25')
  })

  it('throws ApiError on 5xx response', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(500, { error: 'Internal Server Error' }))
    const { loadArticles } = useKnowledgeArticles()
    await expect(loadArticles()).rejects.toMatchObject({ status: 500 })
  })

  it('returns empty items array when articles list is empty', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ articles: [] }))
    const { loadArticles } = useKnowledgeArticles()
    const result = await loadArticles()
    expect(result.items).toHaveLength(0)
    expect(result.nextPageToken).toBeUndefined()
  })
})

describe('useKnowledgeArticles.loadArticle', () => {
  it('returns a mapped Article on success', async () => {
    const detail = {
      id: '000000001',
      title: 'How to report a pothole',
      lastPublishedAt: '2026-01-01T00:00:00Z',
      url: 'report-pothole',
      content: '<p>Fill out the form.</p>',
    }
    fetchMock.mockResolvedValueOnce(okResponse(detail))
    const { loadArticle } = useKnowledgeArticles()
    const article = await loadArticle('000000001')
    expect(article).not.toBeNull()
    expect(article?.id).toBe('000000001')
    expect(article?.title).toBe('How to report a pothole')
    expect(article?.body).toBe('<p>Fill out the form.</p>')
  })

  it('returns null on 404', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Not Found', { status: 404 }))
    const { loadArticle } = useKnowledgeArticles()
    const result = await loadArticle('000000099')
    expect(result).toBeNull()
  })

  it('throws ApiError on 5xx response', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(500, { error: 'Server Error' }))
    const { loadArticle } = useKnowledgeArticles()
    await expect(loadArticle('000000001')).rejects.toMatchObject({ status: 500 })
  })

  it('includes the article id in the request URL', async () => {
    fetchMock.mockResolvedValueOnce(
      okResponse({
        id: '000000042',
        title: 'Test',
        lastPublishedAt: '2026-01-01T00:00:00Z',
        url: 'test',
        content: '',
      }),
    )
    const { loadArticle } = useKnowledgeArticles()
    await loadArticle('000000042')
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('/000000042')
  })
})
