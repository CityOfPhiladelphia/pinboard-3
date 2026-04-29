import { type Ref, ref, toValue, watchEffect } from 'vue'
import type { AisAddressSearchResponse, LatLon } from '../types'

const addressCoordinates = ref<LatLon>({
  latitude: NaN,
  longitude: NaN,
})

export function useSearchAddress(address: string | Ref<string>) {
  async function getAddressCoordinatesFromAIS() {
    address = toValue(address)
    if (!address) {
      clearAddress()
      return
    }

    const url = `https://0spy4bb9w1.execute-api.us-east-1.amazonaws.com/queryAisAddress?address=${encodeURIComponent(address)}`

    try {
      const result: AisAddressSearchResponse = await (await fetch(url)).json()
      console.log(result)
      addressCoordinates.value.longitude =
        result.features[0].geometry.coordinates[0]
      addressCoordinates.value.latitude =
        result.features[0].geometry.coordinates[1]
    } catch (err) {
      console.error('Failed to get response from AIS: ', err)
      clearAddress()
    }
  }

  watchEffect(() => {
    getAddressCoordinatesFromAIS()
  })

  return { addressCoordinates }
}

function clearAddress() {
  addressCoordinates.value.longitude = NaN
  addressCoordinates.value.latitude = NaN
}
