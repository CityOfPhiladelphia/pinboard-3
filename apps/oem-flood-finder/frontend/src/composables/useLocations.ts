import type { LocationListDTO, OemLocation } from '@/types'
import { ref, onMounted, type Ref } from 'vue'
import { useUserLocation } from './useUserLocation'

function transformLocationDTO(dto: LocationListDTO[]): OemLocation[] {
  const locations: OemLocation[] = []

  const currentCoordinates = useUserLocation().userCoords.value;

  for (const loc of dto) {

    const distance = currentCoordinates
      ? getHaversineDistanceMiles(
        loc.latitude,
        loc.longitude,
        currentCoordinates.latitude,
        currentCoordinates.longitude
      )
      : undefined

    locations.push({
      id: loc.id,
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      lastUpdated: loc.lastUpdated,
      deviceType: loc.deviceType,
      locationCardInfo: {
        heading: loc.name,
        subheader: distance ? distance + ' mi' : undefined,
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

function getHaversineDistanceMiles
  (
    deviceLat: number,
    deviceLong: number,
    userLat: number,
    userLong: number
  ): number {
  const R = 6371; // Earth's mean radius in kilometers

  const dLat = (userLat - deviceLat) * (Math.PI / 180);
  const dLon = (userLong - deviceLong) * (Math.PI / 180);

  const lat1 = deviceLat * (Math.PI / 180);
  const lat2 = userLat * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c * 0.621371; // convert to miles
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
