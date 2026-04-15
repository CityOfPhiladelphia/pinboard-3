import type { LocationListDTO, OemLocation } from '@/types'
import { ref, onMounted } from 'vue'

function transformLocationDTO(dto: LocationListDTO[]): OemLocation[] {
  const locations: OemLocation[] = []

  for (const loc of dto) {
    locations.push({
      id: loc.id,
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      lastUpdated: loc.lastUpdated,
      deviceType: loc.deviceType,
      locationCardInfo: {
        heading: loc.name,
        subheader: '0.8 mi',
        tag:
          loc.deviceType === 'Camera'
            ? ''
            : !loc.gaugeHeight || loc.gaugeHeight === -9999.9
              ? 'No data'
              : `${loc.gaugeHeight} ${loc.gaugeHeightUnit}`,
        src: loc.imageUrl,
      },
      actionStage: loc.actionStage,
      minorStage: loc.minorStage,
      moderateStage: loc.moderateStage,
      majorStage: loc.majorStage,
    } satisfies OemLocation)
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

    const response = await fetch(`https://flood-monitoring-test-api.phila.gov/location/all`, {
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
