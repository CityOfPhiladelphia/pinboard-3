import { type Ref, ref, toValue, watchEffect } from 'vue'
import type { LatLon, AisAddressSearchResponse } from '../types'

export function useSearchAddress(address: string | Ref<string>) {
  const addressCoordinates = ref<LatLon>({
    latitude: NaN,
    longitude: NaN,
  })
  const finishedAddressFetch = ref<boolean>(false)

  function clearAddress() {
    addressCoordinates.value.longitude = NaN
    addressCoordinates.value.latitude = NaN
  }

  async function getAddressCoordinatesFromAIS() {
    finishedAddressFetch.value = false
    const addressDeref = toValue(address)
    if (!addressDeref) {
      clearAddress()
      finishedAddressFetch.value = true
      return
    }

    const url = `https://haydr3k097.execute-api.us-east-1.amazonaws.com/queryAis/addresslocation/${encodeURIComponent(addressDeref)}}?client_id=${import.meta.env.DEV ? import.meta.env.VITE_AIS_CLIENTID_OEMFLOOD : ''}`
    try {
      const result: LatLon = await (await fetch(url)).json()
      addressCoordinates.value.longitude = result?.longitude ?? NaN
      addressCoordinates.value.latitude = result?.latitude ?? NaN
      finishedAddressFetch.value = true
    } catch (err) {
      console.error('Failed to get response from AIS: ', err)
      clearAddress()
      finishedAddressFetch.value = true
    }
  }

  watchEffect(() => {
    getAddressCoordinatesFromAIS()
  })

  return { addressCoordinates, finishedAddressFetch }
}
