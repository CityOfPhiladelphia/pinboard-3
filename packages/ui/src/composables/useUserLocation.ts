import { computed, ref, watch } from 'vue'
import type {
  LatLon,
  LocationPermissionState,
  UserLocation,
  UserLocationFound,
  UserLocationFinding,
  UserLocationUnknown,
} from '../types'
import { hasLocationData } from '../utilities/hasLocationData'

export function useUserLocation() {
  const unknownLocation = { longitude: NaN, latitude: NaN }
  const geolocationOptions = { timeout: Infinity, maximumAge: 0, enableHighAccuracy: false }
  const findingLocMessage = 'Getting location...'
  const userLocation = ref<UserLocation>({
    type: 'user',
    permissionState: null,
    waitingMessage: null,
    location: unknownLocation,
  })
  const gotInitialLocation = ref<boolean>(false)
  const watchId = ref<number | null>(null)

  getUserLocation(userLocation.value.permissionState)
  getGeolocatePermissionState()

  watch(gotInitialLocation, (newState) => {
    if (newState) {
      watchId.value = navigator.geolocation.watchPosition(
        locationSuccess,
        locationError,
        geolocationOptions
      )
    }
  })

  watch(
    () => userLocation.value.permissionState,
    (newPermissionState, oldPermissionState) => {
      if (oldPermissionState) {
        switch (newPermissionState) {
          case 'granted':
          case 'prompt': {
            getUserLocation(newPermissionState)
            break
          }
          case 'denied': {
            if (watchId.value) {
              navigator.geolocation.clearWatch(watchId.value)
            }
            clearUserLocation(newPermissionState)
            if (oldPermissionState === 'granted') {
              userLocation.value.permissionState = 'prompt'
            }
            break
          }
        }
      }
    }
  )

  function getUserLocation(permissionState: LocationPermissionState | null) {
    userLocation.value = {
      type: 'user',
      ...({
        permissionState: permissionState,
        waitingMessage: findingLocMessage,
        location: unknownLocation,
      } as UserLocationFinding),
    }
    navigator.geolocation.getCurrentPosition(locationSuccess, locationError, geolocationOptions)
  }

  async function getGeolocatePermissionState() {
    try {
      const useLocationPermission = await navigator.permissions.query({
        name: 'geolocation',
      })
      switch (useLocationPermission.state) {
        case 'granted':
        case 'denied': {
          userLocation.value.permissionState = useLocationPermission.state
          break
        }
        case 'prompt': {
          // if useLocationPermission.state is 'prompt' remain in whatever state resulted from getUserLocation()
          break
        }
      }

      // set userLocationPermission to change whenever navigator.permissions.state changes
      // this section does not work on Safari because Safari has a known bug that keeps this from working (https://bugs.webkit.org/show_bug.cgi?id=259432)
      useLocationPermission.onchange = () => {
        switch (useLocationPermission.state) {
          case 'granted': {
            userLocation.value.permissionState = 'granted'
            break
          }
          case 'denied': {
            userLocation.value.permissionState = 'denied'
            break
          }
          case 'prompt': {
            if (gotInitialLocation.value) {
              userLocation.value.permissionState = 'denied'
            } else {
              getUserLocation(useLocationPermission.state)
            }
            break
          }
        }
      }
    } catch (error) {
      console.error(error)
      userLocation.value.permissionState = 'denied'
    }
  }

  function locationSuccess(position: GeolocationPosition) {
    if (!gotInitialLocation.value) {
      gotInitialLocation.value = true
    }
    const newLocation: UserLocation = {
      type: 'user',
      ...({
        permissionState: 'granted',
        waitingMessage: false,
        location: validateLocation(position.coords)
          ? {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }
          : unknownLocation,
        // only show location on map if user is in or near Philly
      } as UserLocationFound),
    }

    if (!hasLocationData(newLocation.location)) {
      console.error(`Location not in range`)
    }

    // if navigator.permissions is 'prompt' or 'granted' resolve both to 'granted' if user allows location services
  }

  function locationError(error: GeolocationPositionError) {
    userLocation.value.permissionState = 'denied'
    console.error(error)
  }

  function clearUserLocation(newPermissionState: Exclude<LocationPermissionState, 'granted'>) {
    watchId.value = null
    gotInitialLocation.value = false
    userLocation.value = {
      type: 'user',
      ...({
        permissionState: newPermissionState,
        waitingMessage: newPermissionState === 'prompt' ? findingLocMessage : null,
        location: unknownLocation,
      } as UserLocationUnknown),
    }
  }

  return { userLocation }
}

// verify location is in or near enough to Philadelphia
function validateLocation(location: LatLon) {
  return checkLongitudeInRange(location.longitude) && checkLatitudeInRange(location.latitude)
}

function checkLongitudeInRange(longitude: number) {
  return -75.35227 < longitude && longitude < -74.91583
}
function checkLatitudeInRange(latitude: number) {
  return 39.84911 < latitude && latitude < 40.175
}
