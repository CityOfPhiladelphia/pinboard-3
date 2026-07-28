import { ref, toValue, watch, type Ref } from 'vue'
import { hasLocationData } from '../utilities/hasLocationData'
import type { BasicLocation, LatLon, SearchMode } from '../types'
import { useSearchAddress, useSearchZipcode, useUserLocation } from './_index'
import {
  getHaversineDistance,
  StreetAddress,
  StreetIntersection,
  Zipcode,
} from '../utilities/_index'

export function useUserAndSearchLocations<PinboardLocation extends BasicLocation>(
  locations: Ref<PinboardLocation[]>,
  promptLocationOnPageLoad: boolean = false,
  watchLocation: boolean = false
) {
  const { userLocation, userLocationState, endWatch, handleGeolocate, handleGeolocateError } =
    useUserLocation(promptLocationOnPageLoad, watchLocation)
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

  watch(
    () => searchOrUserLocation.value,
    () => {
      if (hasLocationData(searchOrUserLocation.value)) {
        findLocationDistances()
      }
    },
    { deep: 1 }
  )

  watch(
    () => locations.value.length,
    (newLength) => {
      if (newLength && hasLocationData(searchOrUserLocation.value)) {
        findLocationDistances()
      }
    }
  )

  function findLocationDistances() {
    const locsWithDistance = toValue(locations)
    locsWithDistance.forEach((location) => {
      location.distance = `${getHaversineDistance(
        { latitude: location.latitude, longitude: location.longitude },
        {
          latitude: searchOrUserLocation.value.latitude,
          longitude: searchOrUserLocation.value.longitude,
        },
        1
      )} mi`
    })
    locations.value = locsWithDistance
  }

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
    endWatch,
    handleGeolocate,
    handleGeolocateError,
  }
}
