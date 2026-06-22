import { ref, onMounted, type Ref } from 'vue'
import type { PrimaryCareLocation, PrimaryCareResponse } from '@/types'

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

      const response = await fetch(`${ARCGIS_URL}?${params.toString()}`)

      if (!response.ok) {
        errorMessage.value = 'Error retrieving primary care sites'
        return
      }

      const geojsonData = (await response.json()) as PrimaryCareResponse
      geojson.value = geojsonData
      locations.value = geojsonData.features.map((feature) => ({
        id: String(feature.properties.objectid),
        name: (feature.properties.record ?? feature.properties.address ?? '').replace(
          /Womens/,
          "Women's"
        ),
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        locationCardInfo: {
          heading: feature.properties.record ?? feature.properties.address ?? '',
          body: feature.properties.address ?? '',
        },
        ...feature.properties,
      }))
    } catch {
      errorMessage.value = 'Error retrieving primary care sites'
    } finally {
      isLoading.value = false
    }
  }

  onMounted(fetchLocations)
  return { locations, isLoading, errorMessage, geojson }
}
