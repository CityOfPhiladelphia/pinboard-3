import { ref, computed, onBeforeMount, type Ref, type ComputedRef } from 'vue'
import { faWater, faCamera } from '@fortawesome/pro-solid-svg-icons'
import { PinboardUtilities } from '@pinboard/ui'
import type { MapCardProps } from '@phila/phila-ui-cards'
import type { LocationPanelDTO, OemLocation } from '@/types'

export function useLocations(): {
  oemLocations: Ref<OemLocation[]>
  isLoading: ComputedRef<string | false>
  errorMessage: Ref<string | null>
} {
  const oemLocations = ref<OemLocation[]>([])
  const errorMessage = ref<string | null>(null)
  const hasData = ref<boolean>(false)

  const isLoading = computed(() => {
    if (!hasData.value) {
      return 'Loading data...'
    }
    return false
  })

  onBeforeMount(async () => {
    const locations: LocationPanelDTO[] = import.meta.env.DEV
      ? await getLocationsDev(errorMessage)
      : await getLocationsProxy(errorMessage)
    const seenSlugs = new Map<string, number>()
    oemLocations.value = Array.from(locations, (loc) => {
      // Stable, readable id from the name for selection + ?location= deep-links. The flood-API
      // device id (loc.id, used to fetch readings) is kept separately as deviceId.
      const base = PinboardUtilities.slugify(loc.name) || 'location'
      const n = seenSlugs.get(base) ?? 0
      seenSlugs.set(base, n + 1)
      const id = n === 0 ? base : `${base}-${n + 1}`

      const cardInfo: MapCardProps = {
        heading: loc.name,
        subheader: undefined,
        tags: getLocationTags(loc),
        src: loc.thumbnailUrl,
      }

      const oemLocation: OemLocation = {
        id,
        deviceId: loc.id,
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

  return { oemLocations, isLoading, errorMessage }
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
    'https://haydr3k097.execute-api.us-east-1.amazonaws.com/getOemLocations',
  )
  if (!response.ok) {
    errorMessageRef.value = 'Error retrieving gauges'
    return
  }
  return await response.json()
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
  return await response.json()
}
