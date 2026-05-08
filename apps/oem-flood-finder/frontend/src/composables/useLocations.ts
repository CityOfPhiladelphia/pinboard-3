import { ref, computed, onBeforeMount, type Ref, type ComputedRef } from 'vue'
import { faWater, faCamera } from '@fortawesome/pro-solid-svg-icons'
import type { MapCardProps } from '@phila/phila-ui-cards'
import type { LocationPanelDTO, OemLocation } from '@/types'
import { PinboardComposables, PinboardUtilities, type PinboardTypes } from '@pinboard/ui'

const { userLocation, userLocationPermission } = PinboardComposables.useUserLocation()

export function useLocations(): {
  oemLocations: Ref<OemLocation[]>
  userLocation: Ref<PinboardTypes.LatLon>
  isLoading: ComputedRef<boolean>
  errorMessage: Ref<string | null>
} {
  const oemLocations = ref<OemLocation[]>([])
  const errorMessage = ref<string | null>(null)
  const hasData = ref<boolean>(false)

  const isLoading = computed(() => {
    // if has has location services active, isLoading will remain true while resolving user location
    // return !(
    //   hasData.value &&
    //   (userLocationPermission.value === 'denied' || PinboardUtilities.hasLocationData(userLocation))
    // )
    return false
  })

  onBeforeMount(async () => {
    const locations: LocationPanelDTO[] = await getLocationsDev(errorMessage)
    oemLocations.value = Array.from(locations, (loc) => {
      const cardInfo: MapCardProps = {
        heading: loc.name,
        subheader: undefined,
        tags: getLocationTags(loc),
        src: loc.thumbnailUrl,
      }

      const oemLocation: OemLocation = {
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        lastUpdated: new Date(loc.lastUpdated),
        pictureTimestampUTC: new Date(loc.pictureTimestampUTC),
        cameraStreamUrl: loc.cameraStreamUrl,
        deviceType: loc.deviceType,
        actionStage: loc.actionStage,
        minorStage: loc.minorStage,
        moderateStage: loc.moderateStage,
        majorStage: loc.majorStage,
        locationCardInfo: cardInfo,
      }
      return oemLocation
    })
    hasData.value = true
  })

  return { oemLocations, userLocation, isLoading, errorMessage }
}

function getLocationTags(loc: LocationPanelDTO): NonNullable<MapCardProps['tags']> {
  if (loc.deviceType === 'Camera') {
    return [{ text: 'Camera', color: 'purple' as const, iconDefinition: faCamera }]
  }
  const gaugeValue =
    Number.isNaN(loc.gaugeHeight) || loc.gaugeHeight === -9999.9
      ? 'No data'
      : `${loc.gaugeHeight} ${loc.gaugeHeightUnit}`
  return [{ text: 'Gauge', color: 'blue' as const, iconDefinition: faWater }, { text: gaugeValue }]
}

async function getLocationsProxy(errorMessageRef: Ref) {
  const response = await fetch(
    'https://0spy4bb9w1.execute-api.us-east-1.amazonaws.com/getOemLocations',
  )
  if (!response.ok) {
    errorMessageRef.value = 'Error retrieving gauges'
    return
  }
  return response.json()
}

async function getLocationsDev(errorMessageRef: Ref) {
  const myHeaders = new Headers()
  myHeaders.append('x-api-key', import.meta.env.VITE_FLOOD_API_KEY || '')

  const response = await fetch(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/location/all`, {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
  })

  if (!response.ok) {
    errorMessageRef.value = 'Error retrieving gauges'
    return
  }
  return response.json()
}
