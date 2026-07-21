// ABOUTME: Debounced search with stale-result rejection. Wraps a fetcher in a
// ABOUTME: trimmed-query watcher; aborts the previous in-flight call when the
// ABOUTME: query changes, fires onEmpty (or resets) when the query clears.
import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

const DEBOUNCE_MS = 250

interface Options<T> {
  initial: T
  /**
   * Receives the trimmed query and an AbortSignal that fires when a newer
   * search starts or the component unmounts. Fetchers that can pass the
   * signal to `fetch` get true cancellation; fetchers that ignore it still
   * work because the composable drops their result if the signal aborted.
   */
  fetcher: (query: string, signal: AbortSignal) => Promise<T>
  /**
   * Called when the trimmed query is empty. Defaults to `() => initial`.
   * Use this to drive a "browse all" mode (e.g. paginated list when no
   * search term is set).
   */
  onEmpty?: () => Promise<T> | T
}

export interface UseDebouncedSearch<T> {
  query: Ref<string>
  results: Ref<T>
  loading: Ref<boolean>
  error: Ref<string | null>
}

export function useDebouncedSearch<T>(opts: Options<T>): UseDebouncedSearch<T> {
  const onEmpty = opts.onEmpty ?? (() => opts.initial)

  const query = ref('')
  const results = ref(opts.initial) as Ref<T>
  const loading = ref(false)
  const error = ref<string | null>(null)

  let timer: ReturnType<typeof setTimeout> | null = null
  let abort: AbortController | null = null

  function cancel() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    abort?.abort()
    abort = null
  }

  watch(query, (q) => {
    cancel()
    error.value = null
    const trimmed = q.trim()
    if (!trimmed) {
      loading.value = false
      Promise.resolve(onEmpty()).then((v) => {
        results.value = v
      })
      return
    }
    loading.value = true
    timer = setTimeout(async () => {
      const ctl = new AbortController()
      abort = ctl
      try {
        const value = await opts.fetcher(trimmed, ctl.signal)
        if (!ctl.signal.aborted) results.value = value
      } catch (err) {
        if ((err as Error).name === 'AbortError' || ctl.signal.aborted) return
        error.value = (err as Error).message ?? String(err)
      } finally {
        if (!ctl.signal.aborted) loading.value = false
      }
    }, DEBOUNCE_MS)
  })

  onBeforeUnmount(cancel)

  return { query, results, loading, error }
}
