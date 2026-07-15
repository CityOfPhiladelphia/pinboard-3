import { ref, watch } from 'vue'
import type {
  Latitude,
  LatLon,
  LocationPermissionState,
  Longitude,
  UserLocationState,
} from '../types'
import { hasLocationData } from '../utilities/hasLocationData'

export function useUserLocation(promptOnPageLoad: boolean = false, watchLocation: boolean = false) {
  const userLocation = ref<LatLon>({
    latitude: NaN,
    longitude: NaN,
  })
  const userLocationPermissionState = ref<LocationPermissionState>('prompt')
  const userLocationState = ref<UserLocationState>('unknown')
  const gotInitialLocation = ref<boolean>(false)
  const watchId = ref<number | null>(null)
  const geolocationOptions = { timeout: Infinity, maximumAge: 0, enableHighAccuracy: false }

  try {
    navigator.permissions
      .query({
        name: 'geolocation',
      })
      .then((useLocationPermission) => {
        // set userLocationPermissionState to change whenever navigator.permissions.state changes
        // Safari has a known bug that keeps this from working (https://bugs.webkit.org/show_bug.cgi?id=259432)
        useLocationPermission.onchange = () => {
          switch (useLocationPermission.state) {
            case 'granted':
            case 'denied': {
              userLocationPermissionState.value = useLocationPermission.state
              break
            }
            case 'prompt': {
              if (gotInitialLocation.value) {
                userLocationPermissionState.value = 'denied'
              } else {
                getUserLocation()
              }
              break
            }
          }
        }
      })
  } catch (error) {
    console.error(error)
    clearUserLocation()
    userLocationPermissionState.value = 'denied'
  }

  watch(gotInitialLocation, (gotLocation) => {
    if (gotLocation && watchLocation) {
      watchId.value = navigator.geolocation.watchPosition(
        locationSuccess,
        locationError,
        geolocationOptions
      )
    }
  })

  watch(
    userLocationPermissionState,
    (newPermissionState, oldPermissionState) => {
      switch (newPermissionState) {
        case 'granted':
        case 'prompt': {
          if (!gotInitialLocation.value) {
            getUserLocation()
          }
          break
        }
        case 'denied': {
          if (watchId.value) {
            navigator.geolocation.clearWatch(watchId.value)
          }
          clearUserLocation()
          if (oldPermissionState === 'granted') {
            userLocationPermissionState.value = 'prompt'
          }
          break
        }
      }
    },
    { immediate: promptOnPageLoad }
  )

  function getUserLocation() {
    userLocationState.value = 'acquiring'
    navigator.geolocation.getCurrentPosition(locationSuccess, locationError, geolocationOptions)
  }

  function locationSuccess(position: GeolocationPosition) {
    // only show location on map if user is in or near Philly
    userLocation.value.latitude = checkLatitudeInRange(position.coords.latitude)
      ? position.coords.latitude
      : NaN
    userLocation.value.longitude = checkLongitudeInRange(position.coords.longitude)
      ? position.coords.longitude
      : NaN
    if (!hasLocationData(userLocation)) {
      console.error(`Location not in range`)
      userLocation.value.latitude = NaN
      userLocation.value.longitude = NaN
    }

    if (!gotInitialLocation.value) {
      // if navigator.permissions is 'prompt' or 'granted' resolve both to 'granted' if user allows location services
      userLocationPermissionState.value = 'granted'
      userLocationState.value = 'located'
      gotInitialLocation.value = true
    } else {
      userLocationState.value = 'watching'
    }
  }

  function locationError(error: GeolocationPositionError) {
    userLocationPermissionState.value = 'denied'
    userLocationState.value = 'unknown'
    console.error(error)
  }

  function clearUserLocation() {
    watchId.value = null
    gotInitialLocation.value = false
    userLocation.value.latitude = NaN
    userLocation.value.longitude = NaN
    userLocationState.value = 'unknown'
  }

  function endWatch() {
    if (watchId.value) {
      navigator.geolocation.clearWatch(watchId.value)
    }
    clearUserLocation()
  }

  return { userLocation, userLocationState, getUserLocation, endWatch }
}

// verify location is in or near enough to Philadelphia
function checkLongitudeInRange(longitude: Longitude) {
  return -75.35227 < longitude && longitude < -74.91583
}
function checkLatitudeInRange(latitude: Latitude) {
  return 39.84911 < latitude && latitude < 40.175
}
