import { onBeforeMount, ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PinboardUtilities } from '@pinboard/ui'
import type { PrimaryCareLocation, PrimaryCareResponse, PrimaryCareFeature } from '@/types'

const CARTO_RECORDS_QUERY = `https://phl.carto.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM pdph_primary_care_finder WHERE "record" <> 'test'`
const CARTO_LANGUAGES_QUERY = `https://phl.carto.com/api/v2/sql?q=SELECT ARRAY( SELECT DISTINCT trim(unnest(string_to_array(lower(concat_ws(',', VARIADIC array_agg(languages))), ','))) AS language ORDER BY language) AS languages FROM pdph_primary_care_finder WHERE "record" <> 'test'`

export function useLocations(): {
  locations: Ref<PrimaryCareLocation[]>
  languages: Ref<string[]>
  isLoading: Ref<string | false>
  errorMessage: Ref<string | null>
  geojson: Ref<PrimaryCareResponse | undefined>
} {
  const { t } = useI18n()
  const locations = ref<PrimaryCareLocation[]>([])
  const languages = ref<string[]>([])
  const isLoading = ref<string | false>('Loading data...')
  const errorMessage = ref<string | null>(null)
  const geojson = ref<PrimaryCareResponse | undefined>(undefined)

  async function fetchLocations() {
    try {
      const [response, langResponse] = await Promise.all([
        fetch(encodeURI(CARTO_RECORDS_QUERY)),
        fetch(encodeURI(CARTO_LANGUAGES_QUERY)),
      ])

      if (!response.ok) {
        errorMessage.value = t('error.fetchSites')
        return
      }

      if (!langResponse.ok) {
        errorMessage.value = t('error.fetchLanguges')
      }

      const geojsonData = (await response.json()) as PrimaryCareResponse
      languages.value = (await langResponse.json()).rows[0].languages

      // Stable, readable id per site: slug of the name. cartodb_id churns on the daily Carto
      // reload, so a row id makes shared/bookmarked deep-links rot. Deduped so two sites that
      // slug identically stay unique. The map highlights by feature id, so both outputs use it.
      const seenSlugs = new Map<string, number>()
      const ids = geojsonData.features.map((feature: PrimaryCareFeature) => {
        const rawName = String(feature.properties.record ?? feature.properties.address ?? '')
        const base =
          PinboardUtilities.slugify(rawName.replace(/^City of Philadelphia - /, '')) || 'location'
        const n = seenSlugs.get(base) ?? 0
        seenSlugs.set(base, n + 1)
        return n === 0 ? base : `${base}-${n + 1}`
      })

      locations.value = geojsonData.features.map((feature: PrimaryCareFeature, i: number) => ({
        id: ids[i],
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
        features: geojsonData.features.map((feature: PrimaryCareFeature, i: number) => ({
          ...feature,
          properties: { ...feature.properties, id: ids[i] },
        })),
      }
    } catch {
      errorMessage.value = 'Error retrieving primary care sites'
    } finally {
      isLoading.value = false
    }
  }

  onBeforeMount(fetchLocations)

  return { locations, languages, isLoading, errorMessage, geojson }
}
