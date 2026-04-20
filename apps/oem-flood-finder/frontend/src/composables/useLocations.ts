import type { LocationListDTO, OemLocation } from '@/types'
import { ref, onMounted, computed } from 'vue'
import { faWater, faCamera } from '@fortawesome/pro-solid-svg-icons'
import type { TagsProps } from '@phila/phila-ui-tags'
import type { LocationListDTO, OemLocation } from '@/types'

function getLocationTags(loc: LocationListDTO): TagsProps[] {
  if (loc.deviceType === 'Camera') {
    return [{ text: 'Camera', color: 'purple' as const, iconDefinition: faCamera }]
  }
  const gaugeValue =
    !loc.gaugeHeight || loc.gaugeHeight === -9999.9
      ? 'No data'
      : `${loc.gaugeHeight} ${loc.gaugeHeightUnit}`
  return [{ text: 'Gauge', color: 'blue' as const, iconDefinition: faWater }, { text: gaugeValue }]
}

export function useLocations() {
  const locationListDTO = ref<LocationListDTO[] | null>(null)
  const currentLocation = ref<{ lat: number; long: number } | null>(null)
  const isLoading = ref<boolean>(true)
  const errorMessage = ref<string | null>(null)

  const oemLocations = computed(() => {
    const result: OemLocation[] = []

    if (locationListDTO.value === null) {
      return null
    }

    for (const loc of locationListDTO.value) {
      result.push({
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        lastUpdated: loc.lastUpdated,
        deviceType: loc.deviceType,
        locationCardInfo: {
          heading: loc.name,
          subheader:
            currentLocation.value === null
              ? undefined
              : getHaversineDistance(
                loc.latitude,
                loc.longitude,
                currentLocation.value.lat,
                currentLocation.value.long,
              ).toFixed(1) + ' mi',
          tags: getLocationTags(loc),
          src: loc.imageUrl,
        },
        actionStage: loc.actionStage,
        minorStage: loc.minorStage,
        moderateStage: loc.moderateStage,
        majorStage: loc.majorStage,
      } satisfies OemLocation)
    }

    return result
  })

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition((pos) => {
      currentLocation.value = {
        lat: pos.coords.latitude,
        long: pos.coords.longitude,
      }
    })
  }

  onMounted(async () => {
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

    locationListDTO.value = await response.json()
    isLoading.value = false
  })

  return { oemLocations, isLoading, errorMessage }
}

/**
 * @returns distance in miles
 */
function getHaversineDistance(
  deviceLat: number,
  deviceLong: number,
  userLat: number,
  userLong: number,
): number {
  const R = 6371 // Earth's mean radius in kilometers

  const dLat = (userLat - deviceLat) * (Math.PI / 180)
  const dLon = (userLong - deviceLong) * (Math.PI / 180)

  const lat1 = deviceLat * (Math.PI / 180)
  const lat2 = userLat * (Math.PI / 180)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c * 0.621371 // convert to miles
}
