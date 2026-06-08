import { type Ref, ref, toValue, watchEffect } from 'vue'
import type { ZipcodeLocation } from '../types'

export function useSearchZipcode(zipcode: string | Ref<string>) {
  const zipcodePolygon = ref<ZipcodeLocation>({
    type: 'zipcode',
    centroid: {
      latitude: NaN,
      longitude: NaN,
    },
    borderNodes: [],
    fetchComplete: false,
  })

  function clearZipcode(fetchCompleteFlag: boolean) {
    zipcodePolygon.value = {
      type: 'zipcode',
      centroid: {
        latitude: NaN,
        longitude: NaN,
      },
      borderNodes: [],
      fetchComplete: fetchCompleteFlag,
    }
  }

  async function getZipcodeCentroidAndPolygon() {
    zipcodePolygon.value.fetchComplete = false
    const zipcodeDeref = toValue(zipcode).replace(/-\d{4}/, '')
    if (!zipcodeDeref) {
      clearZipcode(true)
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
      const response = await fetch(`${url}?${params}`)
      if (!response.ok) {
        console.error({ status: response.status, message: response.body })
        clearZipcode(true)
        return
      }
      const data = await response.json()
      zipcodePolygon.value = {
        type: 'zipcode',
        centroid: {
          latitude: data.features[0].centroid.y,
          longitude: data.features[0].centroid.x,
        },
        borderNodes: data.features[0].geometry.rings,
        fetchComplete: true,
      }
    } catch (err) {
      console.error('Failed to get response from ArcGIS: ', err)
      clearZipcode(true)
    }
  }

  watchEffect(() => {
    getZipcodeCentroidAndPolygon()
  })

  return { zipcodePolygon }
}
