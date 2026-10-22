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
  const finishedZipFetch = ref<boolean>(true)

  function clearZipcode() {
    zipcodePolygon.value = {
      centroid: {
        latitude: NaN,
        longitude: NaN,
      },
      nodes: [],
    }
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
      const response = await fetch(`${url}?${params}`)
      if (!response.ok) {
        console.error({ status: response.status, message: response.body })
        clearZipcode()
        return
      }
      const data = await response.json()
      const newLocation: ZipcodePolygon = {
        centroid: {
          longitude: data.features[0].centroid.x,
          latitude: data.features[0].centroid.y,
        },
        nodes: data.features[0].geometry.rings,
      }
      zipcodePolygon.value = newLocation
    } catch (err) {
      console.error('Failed to get response from ArcGIS: ', err)
      clearZipcode()
    } finally {
      finishedZipFetch.value = true
    }
  }

  watchEffect(() => {
    getZipcodeCentroidAndPolygon()
  })

  return { zipcodePolygon, finishedZipFetch }
}
