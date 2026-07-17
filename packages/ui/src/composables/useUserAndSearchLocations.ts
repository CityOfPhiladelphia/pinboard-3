import { ref, watch } from 'vue'
import { hasLocationData } from '../utilities/hasLocationData'
import type { LatLon, SearchMode } from '../types'
import { useSearchAddress, useSearchZipcode, useUserLocation } from './_index'
import { StreetAddress, StreetIntersection, Zipcode } from '../utilities/_index'

export function useUserAndSearchLocations(
  promptLocationOnPageLoad: boolean = false,
  watchLocation: boolean = false
) {
  const { userLocation, userLocationState } = useUserLocation(
    promptLocationOnPageLoad,
    watchLocation
  )
  const addressForSearch = ref<string>('')
  const { addressCoordinates, finishedAddressFetch } = useSearchAddress(addressForSearch)
  const zipcodeForSearch = ref<string>('')
  const { zipcodePolygon, finishedZipFetch } = useSearchZipcode(zipcodeForSearch)
  const keywordsForSearch = ref<string>('')
  const locationSearchMode = ref<SearchMode>(undefined)
  const searchOrUserLocation = ref<LatLon>(userLocation.value)

  watch(
    () => userLocation.value,
    (newLoc) => {
      if (
        hasLocationData(newLoc) &&
        !(
          hasLocationData(zipcodePolygon.value.centroid) ||
          hasLocationData(addressCoordinates.value)
        )
      ) {
        searchOrUserLocation.value = userLocation.value
      }
    }
  )

  watch(zipcodePolygon.value.centroid, (newLoc) => {
    if (!hasLocationData(newLoc)) {
      searchOrUserLocation.value = userLocation.value
    }
  })

  watch(addressCoordinates.value, (newLoc) => {
    if (!hasLocationData(newLoc)) {
      searchOrUserLocation.value = userLocation.value
    }
  })

  watch(
    () => finishedAddressFetch.value,
    (newState) => {
      if (newState && hasLocationData(addressCoordinates.value)) {
        searchOrUserLocation.value = addressCoordinates.value
      }
    }
  )

  watch(
    () => finishedZipFetch.value,
    (newState) => {
      if (newState && hasLocationData(zipcodePolygon.value.centroid)) {
        searchOrUserLocation.value = zipcodePolygon.value.centroid
      }
    }
  )

  function handleSearchSubmit(locationSearchString: string) {
    switch (true) {
      case StreetAddress.test(locationSearchString):
      case StreetIntersection.test(locationSearchString): {
        locationSearchMode.value = 'address'
        addressForSearch.value = locationSearchString
        zipcodeForSearch.value = ''
        keywordsForSearch.value = ''
        break
      }
      case Zipcode.test(locationSearchString): {
        locationSearchMode.value = 'zipcode'
        zipcodeForSearch.value = locationSearchString
        addressForSearch.value = ''
        keywordsForSearch.value = ''
        break
      }
      case locationSearchString !== '': {
        locationSearchMode.value = 'keyword'
        keywordsForSearch.value = locationSearchString
        addressForSearch.value = ''
        zipcodeForSearch.value = ''
        break
      }
      default: {
        locationSearchMode.value = undefined
        addressForSearch.value = locationSearchString
        zipcodeForSearch.value = locationSearchString
        keywordsForSearch.value = locationSearchString
      }
    }
  }

  function handleGeolocate(locationData: {
    latitude: number
    longitude: number
    accuracy: number
  }) {
    console.log('Geolocation Accuracy: ', locationData.accuracy)
    userLocation.value = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    }
  }

  function handleGeolocateError(error: Error | GeolocationPositionError) {
    console.error(error)
  }

  return {
    userLocation,
    userLocationState,
    addressForSearch,
    addressCoordinates,
    finishedAddressFetch,
    zipcodeForSearch,
    zipcodePolygon,
    finishedZipFetch,
    keywordsForSearch,
    locationSearchMode,
    searchOrUserLocation,
    handleSearchSubmit,
    handleGeolocate,
    handleGeolocateError,
  }
}
