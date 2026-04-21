import { ref, onMounted, computed } from 'vue'
import { faWater, faCamera } from '@fortawesome/pro-solid-svg-icons'
import type { TagsProps } from '@phila/phila-ui-tags'
import { useHaversineDistance } from '@ui/composables/useHaversineDistance'
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
      const distance =
        currentLocation.value === null
          ? undefined
          : useHaversineDistance(
              { latitude: loc.latitude, longitude: loc.longitude },
              { latitude: currentLocation.value.lat, longitude: currentLocation.value.long },
              1,
            )
      result.push({
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        lastUpdated: loc.lastUpdated,
        deviceType: loc.deviceType,
        locationCardInfo: {
          heading: loc.name,
          subheader: distance ? `${distance} mi` : distance,
          tags: getLocationTags(loc),
          src: loc.imageUrl,
        },
        actionStage: loc.actionStage,
        minorStage: loc.minorStage,
        moderateStage: loc.moderateStage,
        majorStage: loc.majorStage,
      })
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

  return { oemLocations, currentLocation, isLoading, errorMessage }
}
