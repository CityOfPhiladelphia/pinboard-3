import type { LocationDTO, Location } from '@/types'
import { ref, computed, onMounted, type Ref } from 'vue'
import type { State } from '@pinboard/ui'

export const locationMode = ref<'gauges' | 'cameras'>('gauges')

function transformLocationDTO(dto: LocationDTO): Location[] {
  const locations: Location[] = []

  for (const gauge of dto.awareGauges) {
    locations.push({
      id: gauge.gaugeId,
      name: gauge.name,
      latitude: gauge.latitude,
      longitude: gauge.longitude,
      lastUpdated: gauge.lastUpdated,
      other: { kind: 'AwareGauge', data: gauge },
    })
  }

  for (const gauge of dto.usgsGauges) {
    locations.push({
      id: gauge.gaugeId,
      name: gauge.name,
      latitude: gauge.latitude,
      longitude: gauge.longitude,
      lastUpdated: gauge.lastUpdated,
      other: { kind: 'UsgsGauge', data: gauge },
    })
  }

  for (const camera of dto.cameras) {
    locations.push({
      id: camera.cameraId,
      name: camera.name,
      latitude: camera.latitude,
      longitude: camera.longitude,
      lastUpdated: camera.lastUpdated,
      other: { kind: 'Camera', data: camera },
    })
  }

  return locations
}

function filterByMode(locations: Location[], mode: 'gauges' | 'cameras'): Location[] {
  if (mode === 'gauges') {
    return locations.filter(loc => loc.other.kind === 'AwareGauge' || loc.other.kind === 'UsgsGauge')
  }
  return locations.filter(loc => loc.other.kind === 'Camera')
}

export function useLocations(): Ref<State> {
  const allLocations = ref<Location[]>([])
  const fetchState = ref<'loading' | 'loaded' | 'error'>('loading')
  const errorMessage = ref('')

  const state = computed<State>(() => {
    if (fetchState.value === 'loading') return { kind: 'Loading' }
    if (fetchState.value === 'error') return { kind: 'Error', message: errorMessage.value }
    return { kind: 'Loaded', data: filterByMode(allLocations.value, locationMode.value) }
  })

  async function fetchLocations() {
    const myHeaders = new Headers()
    myHeaders.append('x-api-key', import.meta.env.VITE_FLOOD_API_KEY || '')

    const response = await fetch(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/location/all`, {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    })

    if (!response.ok) {
      fetchState.value = 'error'
      errorMessage.value = 'Error retrieving gauges'
      return
    }

    const data: LocationDTO = await response.json()
    allLocations.value = transformLocationDTO(data)
    fetchState.value = 'loaded'
  }

  onMounted(fetchLocations)
  return state
}
