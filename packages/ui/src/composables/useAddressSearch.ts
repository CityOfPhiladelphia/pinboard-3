import { type Ref, ref, toValue, watchEffect } from 'vue'
import type { AisAddressSearchResponse, LatLon } from '../types'

export function useAddressSearch(address: string | Ref<string>) {
  const addressCoordinates = ref<LatLon>({
    latitude: NaN,
    longitude: NaN,
  })

  async function getAddressCoordinatesFromAIS() {
    const addressDeref = toValue(address)
    if (!addressDeref) {
      return
    }

    const url = `https://api.phila.gov/ais/v1/search/${encodeURIComponent(addressDeref)}?gatekeeperKey=${import.meta.env.VITE_OEM_FLOOD_GATEKEEPER_KEY}`

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        const result: AisAddressSearchResponse = json
        addressCoordinates.value.longitude =
          result.features[0].geometry.coordinates[0]
        addressCoordinates.value.latitude =
          result.features[0].geometry.coordinates[1]
      })
      .catch((err) => {
        console.error('Failed to get response from AIS: ', err)
      })
  }

  watchEffect(() => {
    getAddressCoordinatesFromAIS()
  })

  return { addressCoordinates }
}
