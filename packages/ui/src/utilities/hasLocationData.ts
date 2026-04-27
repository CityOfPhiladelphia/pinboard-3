import type { LatLon } from '../types'
import { Ref, toValue } from 'vue'

export function hasLocationData(loc: LatLon | Ref<LatLon>) {
  loc = toValue(loc)
  return !(Number.isNaN(loc.latitude) || Number.isNaN(loc.longitude))
}
