import { type Ref, ref, toValue, watchEffect } from 'vue'
import type { ZipcodePolygon } from '../types'

export function useSearchZipcode(zipcode: string | Ref<string>) {
  const zipcodePolygon = ref<ZipcodePolygon>({
    centroid: {
      latitude: NaN,
      longitude: NaN,
    },
    nodes: [],
  })
  const finishedZipFetch = ref<Boolean>(false)

  function clearZipcode() {
    zipcodePolygon.value.centroid.longitude = NaN
    zipcodePolygon.value.centroid.latitude = NaN
    zipcodePolygon.value.nodes = []
  }

  async function getZipcodeCentroidAndPolygon() {
    finishedZipFetch.value = false
    const zipcodeDeref = toValue(zipcode).replace(/-\d{4}/, '')
    if (!zipcodeDeref) {
      clearZipcode()
      finishedZipFetch.value = true
      return
    }

    const url =
      'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Zipcodes_Poly/FeatureServer/0/query'
    const params = new URLSearchParams({
      where: `code=${zipcodeDeref}`,
      f: 'json',
      outSR: '4326',
      returnCentroid: 'true',
    })

    try {
      const response = await (await fetch(`${url}?${params}`)).json()
      zipcodePolygon.value.centroid.longitude = response.features[0].centroid.x
      zipcodePolygon.value.centroid.latitude = response.features[0].centroid.y
      zipcodePolygon.value.nodes = response.features[0].geometry.rings
      finishedZipFetch.value = true
    } catch (err) {
      console.error('Failed to get response from ArcGIS: ', err)
      clearZipcode()
      finishedZipFetch.value = true
    }
  }

  watchEffect(() => {
    getZipcodeCentroidAndPolygon()
  })

  return { zipcodePolygon, finishedZipFetch }
}
