// ABOUTME: Composable for fetching knowledge articles from the API.
// ABOUTME: Handles list pagination via Link-header offsets and individual article lookup.
import { useAuth } from '@phila/sso-vue'
import { parseError } from './useApiError'
import { api311Fetch } from './api311'
import { parseLinkHeader } from './useNearbyReports'

export interface Article {
  id: string
  title: string
  /** HTML body — must be sanitized before render. */
  body?: string
  lastPublishedAt?: string
  url?: string
}

interface ListResponse {
  articles: Array<{
    id: string
    title: string
    lastPublishedAt: string
    url: string
  }>
}

interface DetailResponse {
  id: string
  title: string
  lastPublishedAt: string
  url: string
  content: string
}

function mapDetailToArticle(r: DetailResponse): Article {
  return {
    id: r.id,
    title: r.title,
    body: r.content,
    lastPublishedAt: r.lastPublishedAt,
    url: r.url,
  }
}

export function useKnowledgeArticles() {
  const auth = useAuth()

  async function loadArticles(
    opts: {
      nextPageToken?: string
      /** Server-side full-text search (Salesforce SOSL across all article fields). */
      search?: string
    } = {},
  ): Promise<{ items: Article[]; nextPageToken?: string }> {
    const response = await api311Fetch({
      path: '/private/key/knowledge-articles',
      query: {
        offset: opts.nextPageToken,
        search: opts.search?.trim() || undefined,
      },
      auth,
    })

    if (!response.ok) {
      throw await parseError(response)
    }

    const body = (await response.json()) as ListResponse
    const items: Article[] = body.articles.map((a) => ({
      id: a.id,
      title: a.title,
      lastPublishedAt: a.lastPublishedAt,
      url: a.url,
    }))

    const { next } = parseLinkHeader(response.headers.get('Link'))
    return { items, nextPageToken: next === null ? undefined : String(next) }
  }

  async function loadArticle(id: string): Promise<Article | null> {
    const response = await api311Fetch({
      path: `/private/key/knowledge-articles/${id}`,
      auth,
    })

    if (response.status === 404) return null

    if (!response.ok) {
      throw await parseError(response)
    }

    const body = (await response.json()) as DetailResponse
    return mapDetailToArticle(body)
  }

  return { loadArticles, loadArticle }
}
