import { type Ref, ref, toValue, watchEffect } from 'vue'
import type { ZipcodePolygon } from '../types'

const zipcodePolygon = ref<ZipcodePolygon>({
  centroid: {
    latitude: NaN,
    longitude: NaN,
  },
  nodes: [],
})

export function useSearchZipcode(zipcode: string | Ref<string>) {
  async function getZipcodeCentroidAndPolygon() {
    zipcode = toValue(zipcode).replace(/-\d{4}/, '')
    if (!zipcode) {
      clearZipcode()
      return
    }

    const url =
      'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Zipcodes_Poly/FeatureServer/0/query'
    const params = new URLSearchParams({
      where: `code=${zipcode}`,
      f: 'json',
      outSR: '4326',
      returnCentroid: 'true',
    })

    try {
      const response = await (await fetch(`${url}?${params}`)).json()
      zipcodePolygon.value.centroid.longitude = response.features[0].centroid.x
      zipcodePolygon.value.centroid.latitude = response.features[0].centroid.y
      zipcodePolygon.value.nodes = response.features[0].geometry.rings
    } catch (err) {
      console.error('Failed to get response from ArcGIS: ', err)
      clearZipcode()
    }
  }

  watchEffect(() => {
    getZipcodeCentroidAndPolygon()
  })

  return { zipcodePolygon }
}

function clearZipcode() {
  zipcodePolygon.value.centroid.longitude = NaN
  zipcodePolygon.value.centroid.latitude = NaN
  zipcodePolygon.value.nodes = []
}
