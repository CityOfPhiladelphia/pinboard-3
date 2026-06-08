// ABOUTME: Cached fetch of /private/key/service-types. One network call per
// ABOUTME: session — the API memoizes for an hour, we cache for the page lifetime.
import { ref, type Ref } from 'vue'
import { useApi } from './useApi'
import type { ServiceType } from '@/types/api'

let cache: ServiceType[] | null = null
const cachedRef = ref<ServiceType[] | null>(null)

interface ServiceTypesResponse {
  serviceTypes: ServiceType[]
}

export function useServiceTypes() {
  const api = useApi<ServiceTypesResponse>({ url: '/private/key/service-types' })

  async function load(): Promise<ServiceType[] | null> {
    if (cache) {
      cachedRef.value = cache
      return cache
    }
    const result = await api.fetchData()
    if (result?.serviceTypes) {
      cache = result.serviceTypes
      cachedRef.value = cache
      return cache
    }
    return null
  }

  return {
    load,
    list: cachedRef as Ref<ServiceType[] | null>,
    isLoading: api.isLoading,
    error: api.error,
  }
}

/** Test utility — clears the module-level cache. Don't use in production code. */
export function _resetServiceTypesCache() {
  cache = null
  cachedRef.value = null
}
