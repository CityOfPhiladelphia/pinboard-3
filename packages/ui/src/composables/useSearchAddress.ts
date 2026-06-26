import { type Ref, ref, toValue, watchEffect } from 'vue'
import type { LatLon } from '../types'

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

    try {
      const url = `https://haydr3k097.execute-api.us-east-1.amazonaws.com/queryAis/addresslocation/${encodeURIComponent(addressDeref)}${import.meta.env.DEV ? `?client_id=${import.meta.env.VITE_AIS_CLIENTID_OEMFLOOD}` : ''}`
      const response = await fetch(url)
      if (!response.ok) {
        clearAddress()
        console.error({ status: response.status, message: response.body })
        return
      }
      const result: LatLon = await response.json()
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
