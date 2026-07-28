// ABOUTME: Component-friendly wrapper around api311Fetch — owns the per-request
// ABOUTME: AbortController, loading/error refs, and ApiError mapping.
import { ref, type Ref } from 'vue'
import { useAuth } from '@phila/sso-vue'
import { ApiError, parseError } from './useApiError'
import { api311Fetch, type QueryParams } from './api311'

export interface UseApiOptions {
  url: string
  method?: string
  body?: unknown
  query?: QueryParams
}

export interface UseApiReturn<T> {
  error: Ref<ApiError | null>
  isLoading: Ref<boolean>
  fetchData: () => Promise<T | null>
}

export function useApi<T>(opts: UseApiOptions): UseApiReturn<T> {
  const error = ref<ApiError | null>(null)
  const isLoading = ref(false)
  let controller: AbortController | null = null

  const auth = useAuth()

  async function fetchData(): Promise<T | null> {
    controller?.abort()
    controller = new AbortController()
    isLoading.value = true
    error.value = null
    try {
      const response = await api311Fetch({
        path: opts.url,
        method: opts.method,
        body: opts.body,
        query: opts.query,
        signal: controller.signal,
        auth,
      })
      if (!response.ok) {
        error.value = await parseError(response)
        return null
      }
      return (await response.json()) as T
    } catch (e) {
      if (e instanceof ApiError) {
        error.value = e
        return null
      }
      const err = e as Error
      if (err.name === 'AbortError') return null
      error.value = new ApiError(0, err.message)
      return null
    } finally {
      isLoading.value = false
    }
  }

  return { error, isLoading, fetchData }
}
