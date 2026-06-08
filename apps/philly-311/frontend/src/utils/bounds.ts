// ABOUTME: Quick check whether a lat/lng is roughly inside Philadelphia.
// ABOUTME: Uses an axis-aligned bounding box; precise polygon comes later.

const PHILLY_BOUNDS = {
  minLat: 39.867,
  maxLat: 40.137,
  minLng: -75.281,
  maxLng: -74.955,
}

export function isInPhilly(lat: number, lng: number): boolean {
  return (
    lat >= PHILLY_BOUNDS.minLat &&
    lat <= PHILLY_BOUNDS.maxLat &&
    lng >= PHILLY_BOUNDS.minLng &&
    lng <= PHILLY_BOUNDS.maxLng
  )
}
