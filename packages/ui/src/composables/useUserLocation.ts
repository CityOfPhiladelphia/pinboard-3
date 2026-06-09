import { ref, watch } from 'vue'
import { type Latitude, type LatLon, type LocationPermissionState, type Longitude } from '../types'
import { hasLocationData } from '../utilities/hasLocationData'

export function useUserLocation() {
  const userLocationPermission = ref<LocationPermissionState | null>(null)
  const userLocation = ref<LatLon>({
    latitude: NaN,
    longitude: NaN,
  })
  const gotInitialLocation = ref<boolean>(false)
  const watchId = ref<number | null>(null)
  const geolocationOptions = { timeout: Infinity, maximumAge: 0, enableHighAccuracy: false }

  watch(gotInitialLocation, (newState) => {
    if (newState) {
      watchId.value = navigator.geolocation.watchPosition(
        locationSuccess,
        locationError,
        geolocationOptions
      )
    }
  })

  watch(userLocationPermission, (newPermissionState, oldPermissionState) => {
    if (oldPermissionState) {
      switch (newPermissionState) {
        case 'granted':
        case 'prompt': {
          getUserLocation()
          break
        }
        case 'denied': {
          if (watchId.value) {
            navigator.geolocation.clearWatch(watchId.value)
          }
          clearUserLocation()
          if (oldPermissionState === 'granted') {
            userLocationPermission.value = 'prompt'
          }
          break
        }
      }
    }
  })
  // set userLocationPermission to navigator.permissions.state, watcher calls getUserLocation() if not 'denied'
  getUserLocation()
  getGeolocatePermissionState()

  async function getGeolocatePermissionState() {
    try {
      const useLocationPermission = await navigator.permissions.query({
        name: 'geolocation',
      })
      switch (useLocationPermission.state) {
        case 'granted':
        case 'denied': {
          userLocationPermission.value = useLocationPermission.state
          break
        }
        case 'prompt': {
          // if useLocationPermission.state is 'prompt' remain in whatever state resulted from getUserLocation()
          break
        }
      }

      // set userLocationPermission to change whenever navigator.permissions.state changes
      // Safari has a known bug that keeps this from working (https://bugs.webkit.org/show_bug.cgi?id=259432)
      useLocationPermission.onchange = () => {
        switch (useLocationPermission.state) {
          case 'granted': {
            userLocationPermission.value = 'granted'
            break
          }
          case 'denied': {
            userLocationPermission.value = 'denied'
            break
          }
          case 'prompt': {
            if (gotInitialLocation.value) {
              userLocationPermission.value = 'denied'
            } else {
              getUserLocation()
            }
            break
          }
        }
      }
    } catch (error) {
      console.error(error)
      userLocationPermission.value = 'denied'
    }
  }

  function getUserLocation() {
    navigator.geolocation.getCurrentPosition(locationSuccess, locationError, geolocationOptions)
  }

  function locationSuccess(position: GeolocationPosition) {
    if (!gotInitialLocation.value) {
      gotInitialLocation.value = true
    }
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

    // if navigator.permissions is 'prompt' or 'granted' resolve both to 'granted' if user allows location services
    userLocationPermission.value = 'granted'
  }

  function locationError(error: GeolocationPositionError) {
    userLocationPermission.value = 'denied'
    console.error(error)
  }

  function clearUserLocation() {
    watchId.value = null
    gotInitialLocation.value = false
    userLocation.value.latitude = NaN
    userLocation.value.longitude = NaN
  }

  return { userLocation, userLocationPermission }
}

// verify location is in or near enough to Philadelphia
function checkLongitudeInRange(longitude: Longitude) {
  return -75.35227 < longitude && longitude < -74.91583
}
function checkLatitudeInRange(latitude: Latitude) {
  return 39.84911 < latitude && latitude < 40.175
}
