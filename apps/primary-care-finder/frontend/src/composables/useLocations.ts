import { ref, onMounted, type Ref } from 'vue'
import type { PrimaryCareLocation, PrimaryCareResponse } from '@/types'

const ARCGIS_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/red_PrimaryCare/FeatureServer/0/query'
// const CARTO_URL = `https://phl.carto.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM pdph_primary_care_finder WHERE "record" <> 'test'`
const CARTO_URL = `https://phl.carto.com/api/v2/sql?q=SELECT *, objectid::text AS id, ST_AsGeoJSON(the_geom)::jsonb as location FROM pdph_primary_care_finder WHERE "record" <> 'test'`

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
      const response2 = await fetch(CARTO_URL)
      const data2 = (await response2.json()).rows
      console.log('CARTO: ', data2)

      // const cartFeats = (await response2.json()).features
      // const cartoRecs = new Set()
      // cartFeats.forEach((element) => {
      //   cartoRecs.add(element.properties.record)
      // })
      // console.log('CARTO: ', [...cartoRecs])

      if (!response.ok) {
        errorMessage.value = 'Error retrieving primary care sites'
        return
      }

      const geojsonData = (await response.json()) as PrimaryCareResponse
      // console.log('AGO: ', geojsonData)

      // const agoRecs = new Set()
      // geojsonData.features.forEach((element) => {
      //   agoRecs.add(element.properties.record)
      // })

      // console.log('AGO: ', [...agoRecs])
      // console.log(agoRecs.difference(cartoRecs))

      geojson.value = geojsonData
      locations.value = geojsonData.features.map((feature) => ({
        id: String(feature.id),
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
      console.log('AGO: ', locations.value)
    } catch {
      errorMessage.value = 'Error retrieving primary care sites'
    } finally {
      isLoading.value = false
    }
  }

  onMounted(fetchLocations)
  return { locations, isLoading, errorMessage, geojson }
}
