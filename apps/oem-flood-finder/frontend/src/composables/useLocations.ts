import type { LocationDTO, Location } from '@/types'
import { reactive, ref, computed, onMounted, type Ref } from 'vue'
import type { State } from '@pinboard/ui'

const allLocations = ref<Location[]>([])
export const gaugeHeights = reactive(new Map<string, string>())

function transformLocationDTO(dto: LocationDTO): Location[] {
  const locations: Location[] = []

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

export function useLocations(): Ref<State> {
  const fetchState = ref<'loading' | 'loaded' | 'error'>('loading')
  const errorMessage = ref('')

  const state = computed<State>(() => {
    if (fetchState.value === 'loading') return { kind: 'Loading' }
    if (fetchState.value === 'error') return { kind: 'Error', message: errorMessage.value }
    return { kind: 'Loaded', data: allLocations.value }
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
    fetchGaugeHeights(allLocations.value, myHeaders)
  }

  async function fetchGaugeHeights(locations: Location[], headers: Headers) {
    const gauges = locations.filter(loc => loc.other.kind === 'Aware' || loc.other.kind === 'Usgs')

    await Promise.allSettled(gauges.map(async (loc) => {
      const kind = loc.other.kind.toLowerCase()
      const response = await fetch(
        `${import.meta.env.VITE_FLOOD_API_BASE_URL}/${kind}/reading/${loc.id}?limit=1`,
        { method: 'GET', headers, redirect: 'follow' },
      )
      if (!response.ok) return

      const readings = await response.json()
      if (!readings.length) return

      const reading = readings[0]
      if (reading.gaugeHeight < -100) return

      const heightInInches = reading.gaugeHeightUnit === 'ft'
        ? Math.round(reading.gaugeHeight * 12 * 100) / 100
        : reading.gaugeHeight
      gaugeHeights.set(loc.id, `${heightInInches} in`)
    }))
  }

  onMounted(fetchLocations)
  return state
}
