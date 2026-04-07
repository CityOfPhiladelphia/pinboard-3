import type { LocationDTO, OemLocation } from '@/types'
import { ref, onMounted } from 'vue'

function transformLocationDTO(dto: LocationDTO): OemLocation[] {
  const locations: OemLocation[] = []

  for (const gauge of dto.awareGauges) {
    locations.push({
      id: gauge.gaugeId,
      name: gauge.name,
      latitude: gauge.latitude,
      longitude: gauge.longitude,
      lastUpdated: gauge.lastUpdated,
      other: { kind: 'Aware', data: gauge },
    })
  }

  for (const gauge of dto.usgsGauges) {
    locations.push({
      id: gauge.gaugeId,
      name: gauge.name,
      latitude: gauge.latitude,
      longitude: gauge.longitude,
      lastUpdated: gauge.lastUpdated,
      other: { kind: 'Usgs', data: gauge },
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

export function useLocations() {
  // set to Loading initially
  const isLoading = ref(true)
  const errorMessage = ref<string | null>(null)
  const locations = ref<OemLocation[]>([])

  async function fetchLocations() {
    const myHeaders = new Headers()
    myHeaders.append('x-api-key', import.meta.env.VITE_FLOOD_API_KEY || '')

    const response = await fetch(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/location/all`, {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    })

    if (!response.ok) {
      errorMessage.value = 'Error retrieving gauges'
      return
    }

    locations.value = transformLocationDTO(await response.json())
    isLoading.value = false
  }

  onMounted(fetchLocations)

  return { locations, isLoading, errorMessage }
}
