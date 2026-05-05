import { ref, computed, onBeforeMount } from 'vue'
import { faWater, faCamera } from '@fortawesome/pro-solid-svg-icons'
import type { TagsProps } from '@phila/phila-ui-tags'
import type { MapCardProps } from '@phila/phila-ui-cards'
import type { LocationPanelDTO, OemLocation } from '@/types'
import { PinboardComposables, PinboardUtilities } from '@pinboard/ui'

const { userLocation, userLocationPermission } = PinboardComposables.useUserLocation()

export function useLocations() {
  const oemLocations = ref<OemLocation[]>([])
  const errorMessage = ref<string | null>(null)
  const hasData = ref<boolean>(false)

  const isLoading = computed(() => {
    // if has has location services active, isLoading will remain true while resolving user location
    return !(
      hasData.value &&
      (userLocationPermission.value === 'denied' || PinboardUtilities.hasLocationData(userLocation))
    )
  })

  onBeforeMount(async () => {
    const myHeaders = new Headers()
    myHeaders.append('x-api-key', import.meta.env.VITE_FLOOD_API_KEY_PROD || '')

    console.log(import.meta.env.VITE_FLOOD_API_BASE_TEST);

    const response = await fetch(`${import.meta.env.VITE_FLOOD_API_BASE_URL_PROD}/location/all`, {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    })

    if (!response.ok) {
      errorMessage.value = 'Error retrieving gauges'
      return
    }

    const locations: LocationPanelDTO[] = await response.json()
    oemLocations.value = Array.from(locations, (loc) => {
      const cardInfo: MapCardProps = {
        heading: loc.name,
        subheader: undefined,
        tags: getLocationTags(loc),
        src: loc.thumbnailUrl,
      }
      return {
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        lastUpdated: loc.lastUpdated,
        gaugeHeight: loc.gaugeHeight,
        gaugeHeightUnit: loc.gaugeHeightUnit,
        thumbnailUrl: loc.thumbnailUrl,
        cameraStreamUrl: loc.cameraStreamUrl,
        deviceType: loc.deviceType,
        actionStage: loc.actionStage,
        minorStage: loc.minorStage,
        moderateStage: loc.moderateStage,
        majorStage: loc.majorStage,
        locationCardInfo: cardInfo,
      }
    })
    hasData.value = true
  })

  return { oemLocations, userLocation, isLoading, errorMessage }
}

function getLocationTags(loc: LocationPanelDTO): TagsProps[] {
  if (loc.deviceType === 'Camera') {
    return [{ text: 'Camera', color: 'purple' as const, iconDefinition: faCamera }]
  }
  const gaugeValue =
    Number.isNaN(loc.gaugeHeight) || loc.gaugeHeight === -9999.9
      ? 'No data'
      : `${loc.gaugeHeight} ${loc.gaugeHeightUnit}`
  return [{ text: 'Gauge', color: 'blue' as const, iconDefinition: faWater }, { text: gaugeValue }]
}
