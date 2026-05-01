import { type Ref, toValue } from 'vue'
import type { LatLon } from '../types'

export function getHaversineDistance(
  locA: LatLon | Ref<LatLon>,
  locB: LatLon | Ref<LatLon>,
  decimalPrecision: number
) {
  const unrefA = toValue(locA)
  const unrefB = toValue(locB)
  const decimalPrecisionFloor = Math.floor(Math.abs(decimalPrecision))
  const R = 6371 // Earth's mean radius in kilometers

  const dLat = (unrefA.latitude - unrefB.latitude) * (Math.PI / 180)
  const dLon = (unrefA.longitude - unrefB.longitude) * (Math.PI / 180)

  const lat1 = unrefB.latitude * (Math.PI / 180)
  const lat2 = unrefA.latitude * (Math.PI / 180)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  const haversineDistance = (R * c * 0.621371).toFixed(
    decimalPrecisionFloor <= 20 ? decimalPrecisionFloor : 20
  ) // convert to miles

  return haversineDistance
}
