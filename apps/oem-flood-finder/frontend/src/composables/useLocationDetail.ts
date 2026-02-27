import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Location, LocationDetail } from '../types'

export function useLocationDetail(location: Ref<Location | null>) {
  const locationDetail = ref<LocationDetail | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  let abortController: AbortController | null = null

  async function fetchLocationDetail(loc: Location, signal: AbortSignal) {
    locationDetail.value = null
    isLoading.value = true
    error.value = null
    try {
      // TODO: replace with API call, passing signal to fetch()
      // locationDetail.value = await fetchFromApi(loc, signal)
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      if (!signal.aborted) isLoading.value = false
    }
  }

  watch(location, (loc) => {
    abortController?.abort()
    if (!loc) return
    abortController = new AbortController()
    fetchLocationDetail(loc, abortController.signal)
  })

  return { locationDetail, isLoading, error }
}
