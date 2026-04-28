import { ref, computed, onBeforeMount } from 'vue'
import { faWater, faCamera } from '@fortawesome/pro-solid-svg-icons'
import type { TagsProps } from '@phila/phila-ui-tags'
import type { MapCardProps } from '@phila/phila-ui-cards'
import type { LocationListDTO, OemLocation } from '@/types'
import { useUserLocation } from '@ui/composables/_index'
import { hasLocationData, getHaversineDistance } from '@ui/utilities/_index'

const { userLocation, userLocationPermission } = useUserLocation()

export function useLocations() {
  const oemLocations = ref<OemLocation[] | null>(null)
  const errorMessage = ref<string | null>(null)
  const hasData = ref<boolean>(false)

  const isLoading = computed(() => {
    // if has has location services active, isLoading will remain true while resolving user location
    return !(
      hasData.value &&
      (userLocationPermission.value === 'denied' || hasLocationData(userLocation))
    )
  })

  onBeforeMount(async () => {
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

    const locations: LocationListDTO[] = await response.json()
    oemLocations.value = Array.from(locations, (loc) => {
      const cardInfo: MapCardProps = {
        heading: loc.name,
        subheader: hasLocationData(userLocation)
          ? getHaversineDistance(
              userLocation,
              { latitude: loc.latitude, longitude: loc.longitude },
              1,
            )
          : undefined,
        tags: getLocationTags(loc),
        src: loc.imageUrl,
      }
      return {
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        lastUpdated: loc.lastUpdated,
        deviceType: loc.deviceType,
        locationCardInfo: cardInfo,
        actionStage: loc.actionStage,
        minorStage: loc.minorStage,
        moderateStage: loc.moderateStage,
        majorStage: loc.majorStage,
      }
    })
    hasData.value = true
  })

  return { oemLocations, userLocation, isLoading, errorMessage }
}

function getLocationTags(loc: LocationListDTO): TagsProps[] {
  if (loc.deviceType === 'Camera') {
    return [{ text: 'Camera', color: 'purple' as const, iconDefinition: faCamera }]
  }
  const gaugeValue =
    Number.isNaN(loc.gaugeHeight) || loc.gaugeHeight === -9999.9
      ? 'No data'
      : `${loc.gaugeHeight} ${loc.gaugeHeightUnit}`
  return [{ text: 'Gauge', color: 'blue' as const, iconDefinition: faWater }, { text: gaugeValue }]
}
