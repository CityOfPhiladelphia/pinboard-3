import { ref, onMounted, type Ref } from 'vue'
import type { PrimaryCareLocation, PrimaryCareResponse, PrimaryCareFeature } from '@/types'

const CARTO_URL = `https://phl.carto.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM pdph_primary_care_finder WHERE "record" <> 'test'`

export function useLocations(): {
  locations: Ref<PrimaryCareLocation[]>
  isLoading: Ref<string | false>
  errorMessage: Ref<string | null>
  geojson: Ref<PrimaryCareResponse | undefined>
} {
  const locations = ref<PrimaryCareLocation[]>([])
  const isLoading = ref<string | false>('Loading data...')
  const errorMessage = ref<string | null>(null)
  const geojson = ref<PrimaryCareResponse | undefined>(undefined)

  async function fetchLocations() {
    try {
      const response = await fetch(encodeURI(CARTO_URL))

      if (!response.ok) {
        errorMessage.value = 'Error retrieving primary care sites'
        return
      }

      const geojsonData = (await response.json()) as PrimaryCareResponse
      locations.value = geojsonData.features.map((feature: PrimaryCareFeature) => ({
        id: String(feature.properties.cartodb_id),
        name: (feature.properties.record ?? feature.properties.address ?? '').replace(
          /Womens/,
          "Women's"
        ),
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        properties: feature.properties,
        geometry: feature.geometry,
        locationCardInfo: {
          heading: String(feature.properties.record ?? feature.properties.address ?? ''),
          body: String(feature.properties.address ?? ''),
        },
      }))

      geojson.value = {
        type: 'FeatureCollection' as const,
        features: geojsonData.features.map((feature: PrimaryCareFeature) => ({
          ...feature,
          properties: { ...feature.properties, id: String(feature.properties.cartodb_id) },
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
