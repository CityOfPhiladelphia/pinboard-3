import type { LatLon, MapBounds } from '../types'

/**
 * Whether a lat/lng point falls within a map viewport's bounds. Plain bbox
 * containment (no antimeridian handling) - sufficient for any single-region
 * finder app's viewport.
 */
export function isLocationInBounds(loc: LatLon, bounds: MapBounds): boolean {
  return (
    loc.longitude >= bounds.west &&
    loc.longitude <= bounds.east &&
    loc.latitude >= bounds.south &&
    loc.latitude <= bounds.north
  )
}
