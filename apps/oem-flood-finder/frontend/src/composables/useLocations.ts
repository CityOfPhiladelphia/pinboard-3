import type { LocationDTO, Location } from '@/types'
import { ref, onMounted, type Ref } from 'vue'
import type { State } from '@pinboard/ui'

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

export function useLocations(): Ref<State> {
  const state = ref<State>({ kind: 'Loading' })

  async function fetchLocations() {
    const myHeaders = new Headers()
    myHeaders.append('x-api-key', import.meta.env.VITE_FLOOD_API_KEY || '')

    const response = await fetch(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/location/all`, {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    })

    if (!response.ok) {
      state.value = { kind: 'Error', message: 'Error retrieving gauges' }
      return
    }

    const data: LocationDTO = await response.json()
    state.value = { kind: 'Loaded', data: transformLocationDTO(data) }
  }

  onMounted(fetchLocations)
  return state
}
