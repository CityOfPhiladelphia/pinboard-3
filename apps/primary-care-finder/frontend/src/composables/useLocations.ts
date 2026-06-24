import { ref, onMounted, type Ref } from 'vue'
import { PinboardUtilities } from '@pinboard/ui'
import type { PrimaryCareLocation, PrimaryCareResponse, PrimaryCareProperties } from '@/types'

const ARCGIS_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/red_PrimaryCare/FeatureServer/0/query'

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

      // Stable, readable id per site: slug of the name (OBJECTID churns on the daily reload).
      // Deduped so two sites that slug identically stay unique.
      const seenSlugs = new Map<string, number>()
      const ids = geojsonData.features.map((feature: RawFeature) => {
        const rawName = String(feature.properties.record ?? feature.properties.address ?? '')
        const base =
          PinboardUtilities.slugify(rawName.replace(/^City of Philadelphia - /, '')) || 'location'
        const n = seenSlugs.get(base) ?? 0
        seenSlugs.set(base, n + 1)
        return n === 0 ? base : `${base}-${n + 1}`
      })

      locations.value = geojsonData.features.map(
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
        features: geojsonData.features.map((f: RawFeature, i: number) => ({
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
