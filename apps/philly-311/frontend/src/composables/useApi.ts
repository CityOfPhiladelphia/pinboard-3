// ABOUTME: Component-friendly wrapper around api311Fetch — owns the per-request
// ABOUTME: AbortController, loading/error/data refs, and ApiError mapping.
import { shallowRef, ref, type Ref, type ShallowRef } from 'vue'
import { useAuth } from '@phila/sso-vue'
import { ApiError, parseError } from './useApiError'
import { api311Fetch, type QueryParams } from './api311'

export interface UseApiOptions {
  url: string
  method?: string
  body?: unknown
  query?: QueryParams
  /** Reject before fetch if the user is not signed in. Default false. */
  requireAuth?: boolean
}

export interface UseApiReturn<T> {
  data: ShallowRef<T | null>
  error: Ref<ApiError | null>
  isLoading: Ref<boolean>
  fetchData: () => Promise<T | null>
  abort: () => void
}

export function useApi<T>(opts: UseApiOptions): UseApiReturn<T> {
  const data = shallowRef<T | null>(null)
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
      if (opts.requireAuth && !auth.isAuthenticated.value) {
        throw new ApiError(401, 'Authentication required')
      }
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
      const json = (await response.json()) as T
      data.value = json
      return json
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

  function abort() {
    controller?.abort()
  }

  return { data, error, isLoading, fetchData, abort }
}
