import { ref, onMounted, type Ref } from 'vue'
import type { PrimaryCareLocation, PrimaryCareFeature, PrimaryCareResponse } from '@/types'

const ARCGIS_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/red_PrimaryCare/FeatureServer/0/query'

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
        where: "data_complete=2 AND record<>'test'",
        outFields: '*',
        f: 'geojson',
      })

      const response = await fetch(`${ARCGIS_URL}?${params}`)

      if (!response.ok) {
        errorMessage.value = 'Error retrieving primary care sites'
        return
      }

      const rawGeojson = (await response.json()) as PrimaryCareResponse

      locations.value = rawGeojson.features.map((feature) => ({
        id: String(feature.properties.objectid),
        name: String(feature.properties.record ?? feature.properties.address ?? ''),
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        properties: feature.properties,
        locationCardInfo: {
          heading: String(feature.properties.record ?? feature.properties.address ?? ''),
          body: String(feature.properties.address ?? ''),
        },
      }))

      geojson.value = {
        type: 'FeatureCollection',
        features: rawGeojson.features.map((f) => ({
          ...f,
          properties: { ...f.properties, id: String(f.properties.objectid) },
        })),
      } as const
    } catch {
      errorMessage.value = 'Error retrieving primary care sites'
    } finally {
      isLoading.value = false
    }
  }

  onMounted(fetchLocations)
  return { locations, isLoading, errorMessage, geojson }
}
