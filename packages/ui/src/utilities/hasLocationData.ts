import type { LatLon } from '../types'
import { type Ref, toValue } from 'vue'

export function hasLocationData(loc: LatLon | Ref<LatLon>) {
  loc = toValue(loc)
  return loc && !(Number.isNaN(loc.latitude) || Number.isNaN(loc.longitude))
}
