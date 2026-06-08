// ABOUTME: Composable for fetching knowledge articles from the API.
// ABOUTME: Handles list pagination via Link-header offsets and individual article lookup.
import { useAuth } from '@phila/sso-vue'
import { parseError } from './useApiError'
import { api311Fetch } from './api311'

export interface Article {
  id: string
  title: string
  /** HTML body — must be sanitized before render. */
  body?: string
  serviceType?: string
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

/** Parse the rel="next" link from a Link header, return the offset value or undefined. */
function parseNextOffset(linkHeader: string | null): string | undefined {
  if (!linkHeader) return undefined
  const parts = linkHeader.split(',')
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/)
    if (match && match[1]) {
      try {
        const url = new URL(match[1])
        const offset = url.searchParams.get('offset')
        return offset ?? undefined
      } catch {
        return undefined
      }
    }
  }
  return undefined
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
      pageSize?: number
      nextPageToken?: string
      /** Server-side full-text search (Salesforce SOSL across all article fields). */
      search?: string
    } = {},
  ): Promise<{ items: Article[]; nextPageToken?: string }> {
    const response = await api311Fetch({
      path: '/private/key/knowledge-articles',
      query: {
        limit: opts.pageSize,
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

    const nextPageToken = parseNextOffset(response.headers.get('Link'))
    return { items, nextPageToken }
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
