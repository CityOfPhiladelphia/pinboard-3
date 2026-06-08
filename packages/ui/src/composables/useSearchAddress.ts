import { type Ref, ref, toValue, watchEffect } from 'vue'
import type { AddressLocation, LatLon, AisAddressSearchResponse } from '../types'

export function useSearchAddress(address: string | Ref<string>) {
  const addressCoordinates = ref<AddressLocation>({
    type: 'address',
    location: {
      latitude: NaN,
      longitude: NaN,
    },
    fetchComplete: false,
  })
  const finishedAddressFetch = ref<boolean>(false)

  function clearAddress() {
    addressCoordinates.value.location = {
      latitude: NaN,
      longitude: NaN,
    }
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
      const url = `${import.meta.env.DEV ? `${import.meta.env.VITE_AIS_URL}/addresses/` : 'https://haydr3k097.execute-api.us-east-1.amazonaws.com/queryAis/addresslocation/'}${encodeURIComponent(addressDeref)}?client_id=${import.meta.env.DEV ? import.meta.env.VITE_AIS_CLIENTID_OEMFLOOD : ''}`
      const response = await fetch(url)
      if (!response.ok) {
        clearAddress()
        console.error({ status: response.status, message: response.body })
        return
      }
      if (import.meta.env.DEV) {
        const result: AisAddressSearchResponse = await response.json()
        addressCoordinates.value = {
          type: 'address',
          location: {
            longitude: result.features[0].geometry.coordinates[0],
            latitude: result.features[0].geometry.coordinates[1],
          },
          fetchComplete: true,
        }
      } else {
        const result: LatLon = await response.json()
        addressCoordinates.value = {
          type: 'address',
          location: {
            longitude: result.longitude,
            latitude: result.latitude,
          },
          fetchComplete: true,
        }
      }
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
