import type { LocationDTO, OemLocation, Reading } from '@/types'
import { ref, onMounted } from 'vue'

function transformLocationDTO(dto: LocationDTO): OemLocation[] {
  const locations: OemLocation[] = new Array()

  for (const gauge of dto.awareGauges) {
    locations.push({
      id: gauge.gaugeId,
      name: gauge.name,
      latitude: gauge.latitude,
      longitude: gauge.longitude,
      lastUpdated: gauge.lastUpdated,
      latestReading: null,
      other: { kind: 'Aware', data: gauge },
    } satisfies OemLocation)
  }

  for (const gauge of dto.usgsGauges) {
    locations.push({
      id: gauge.gaugeId,
      name: gauge.name,
      latitude: gauge.latitude,
      longitude: gauge.longitude,
      lastUpdated: gauge.lastUpdated,
      latestReading: null,
      other: { kind: 'Usgs', data: gauge },
    } satisfies OemLocation)
  }

  for (const camera of dto.cameras) {
    locations.push({
      id: camera.cameraId,
      name: camera.name,
      latitude: camera.latitude,
      longitude: camera.longitude,
      lastUpdated: camera.lastUpdated,
      latestReading: null,
      other: { kind: 'Camera', data: camera },
    } satisfies OemLocation)
  }

  return locations
}

async function fetchLatestReading(
  kind: 'aware' | 'usgs',
  gaugeId: string,
  headers: Headers,
): Promise<Reading | null> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_FLOOD_API_BASE_URL}/${kind}/reading/${gaugeId}?limit=1`,
      { method: 'GET', headers, redirect: 'follow' },
    )
    if (!response.ok) return null
    const data: Reading[] = await response.json()
    return data[0] ?? null
  } catch {
    return null
  }
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

    // Fetch latest readings for all gauges in parallel
    const gauges = locations.value.filter((loc) => loc.other.kind !== 'Camera')
    await Promise.all(
      gauges.map(async (loc) => {
        const kind = loc.other.kind.toLowerCase() as 'aware' | 'usgs'
        const reading = await fetchLatestReading(kind, loc.id, myHeaders)
        loc.latestReading = reading
      }),
    )
  }

  onMounted(fetchLocations)

  return { locations, isLoading, errorMessage }
}
