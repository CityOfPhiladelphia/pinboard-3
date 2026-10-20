// ABOUTME: Composable for fetching knowledge articles from the API.
// ABOUTME: Handles list pagination via Link-header offsets and individual article lookup.
import { useAuth } from '@phila/sso-vue'
import { parseError } from './useApiError'
import { api311Fetch } from './api311'
import { parseLinkHeader } from './useNearbyReports'

export interface Article {
  id: string
  title: string
  lastPublishedAt?: string
  url?: string
  content?: string /** HTML body — must be sanitized before render. */
}

interface ListResponse {
  articles: Article[]
}

export function useKnowledgeArticles() {
  const auth = useAuth()

  async function loadArticles(
    opts: {
      nextPageToken?: string
      /** Server-side full-text search (Salesforce SOSL across all article fields). */
      search?: string
      /** Curated Salesforce list view; mutually exclusive with search server-side. */
      list?: 'featured'
      sort?: 'title' | 'lastPublishedAt'
      direction?: 'asc' | 'desc'
      limit?: number
      /** Aborts the underlying fetch, e.g. when a newer search supersedes this one. */
      signal?: AbortSignal
    } = {},
  ): Promise<{ items: Article[]; nextPageToken?: string }> {
    const response = await api311Fetch({
      path: '/private/key/knowledge-articles',
      query: {
        offset: opts.nextPageToken,
        search: opts.search?.trim() || undefined,
        list: opts.list,
        sort: opts.sort,
        direction: opts.direction,
        limit: opts.limit,
      },
      signal: opts.signal,
      auth,
    })

    if (!response.ok) throw await parseError(response)

    const body = (await response.json()) as ListResponse
    const items = body.articles
    const { next } = parseLinkHeader(response.headers.get('Link'))
    return { items, nextPageToken: next === null ? undefined : String(next) }
  }

  async function loadArticle(id: string): Promise<Article | null> {
    const response = await api311Fetch({
      path: `/private/key/knowledge-articles/${id}`,
      auth,
    })

    if (response.status === 404) return null
    if (!response.ok) throw await parseError(response)

    const body = (await response.json()) as Article
    return body
  }

  return { loadArticles, loadArticle }
}
