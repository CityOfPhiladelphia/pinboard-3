import { ref, computed, onBeforeMount, type Ref, type ComputedRef } from 'vue'
import type { OemLocation } from '@/types'

export function useLocations(): {
  oemLocations: Ref<OemLocation[]>
  isLoading: ComputedRef<string | false>
  errorMessage: Ref<string | null>
} {
  const oemLocations = ref<OemLocation[]>([])
  const errorMessage = ref<string | null>(null)
  const hasData = ref<boolean>(false)

  const isLoading = computed(() => {
    if (!hasData.value) {
      return 'Loading data...'
    }
    return false
  })

  onBeforeMount(async () => {
    oemLocations.value = import.meta.env.DEV
      ? await getLocationsDev(errorMessage)
      : await getLocationsProxy(errorMessage)
    hasData.value = true
  })

  return { oemLocations, isLoading, errorMessage }
}

async function getLocationsProxy(errorMessageRef: Ref) {
  const response = await fetch(
    'https://haydr3k097.execute-api.us-east-1.amazonaws.com/getOemLocations',
  )
  if (!response.ok) {
    errorMessageRef.value = 'Error retrieving gauges'
    return
  }
  return await response.json()
}

async function getLocationsDev(errorMessageRef: Ref) {
  const myHeaders = new Headers()
  myHeaders.append('x-api-key', import.meta.env.VITE_FLOOD_API_KEY || '')

  const response = await fetch(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/location/all`, {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
  })

  if (!response.ok) {
    errorMessageRef.value = 'Error retrieving gauges'
    return
  }
  return await response.json()
}
