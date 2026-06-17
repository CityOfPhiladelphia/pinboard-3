import { ref, onMounted, type Ref } from 'vue'
import { PinboardUtilities } from '@pinboard/ui'
import type { PrimaryCareLocation, PrimaryCareProperties } from '@/types'

const ARCGIS_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/red_PrimaryCare/FeatureServer/0/query'

interface RawFeature {
  properties: Record<string, unknown>
  geometry: { type: string; coordinates: [number, number, ...number[]] }
}

function isVisible(feature: RawFeature): boolean {
  const props = feature.properties

  // Exclude incomplete records
  if (props.data_complete !== '2') return false

  // Exclude test records
  if (['3', '5', '6', '7', '8', '9'].includes(props.record as string)) return false

  // Exclude test addresses
  if (props.address === 'Test') return false

  return true
}

export function useLocations(): {
  locations: Ref<PrimaryCareLocation[]>
  isLoading: Ref<string | false>
  errorMessage: Ref<string | null>
  geojson: Ref<unknown>
} {
  const locations = ref<PrimaryCareLocation[]>([])
  const isLoading = ref<string | false>('Loading data...')
  const errorMessage = ref<string | null>(null)
  const geojson = ref<unknown>(null)

  async function fetchLocations() {
    try {
      const params = new URLSearchParams({
        where: '1=1',
        outFields: '*',
        f: 'geojson',
      })

      const response = await fetch(`${ARCGIS_URL}?${params}`)

      if (!response.ok) {
        errorMessage.value = 'Error retrieving primary care sites'
        return
      }

      const rawGeojson = await response.json()
      const filteredFeatures = rawGeojson.features.filter(isVisible)

      // Stable, readable id per site: slug of the name (OBJECTID churns on the daily reload).
      // Deduped so two sites that slug identically stay unique.
      const seenSlugs = new Map<string, number>()
      const ids = filteredFeatures.map((feature: RawFeature) => {
        const rawName = String(feature.properties.record ?? feature.properties.address ?? '')
        const base =
          PinboardUtilities.slugify(rawName.replace(/^City of Philadelphia - /, '')) || 'location'
        const n = seenSlugs.get(base) ?? 0
        seenSlugs.set(base, n + 1)
        return n === 0 ? base : `${base}-${n + 1}`
      })

      locations.value = filteredFeatures.map(
        (feature: RawFeature, i: number) =>
          ({
            id: ids[i],
            name: String(feature.properties.record ?? feature.properties.address ?? ''),
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
            properties: feature.properties as PrimaryCareProperties,
            geometry: feature.geometry,
            locationCardInfo: {
              heading: String(feature.properties.record ?? feature.properties.address ?? ''),
              body: String(feature.properties.address ?? ''),
            },
          }) satisfies PrimaryCareLocation
      )

      geojson.value = {
        type: 'FeatureCollection' as const,
        features: filteredFeatures.map((f: RawFeature, i: number) => ({
          ...f,
          properties: { ...f.properties, id: ids[i] },
        })),
      }
    } catch {
      errorMessage.value = 'Error retrieving primary care sites'
    } finally {
      isLoading.value = false
    }
  }

  onMounted(fetchLocations)
  return { locations, isLoading, errorMessage, geojson }
}
