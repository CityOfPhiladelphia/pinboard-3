// ABOUTME: Meters-to-pixels conversion for sizing a geolocation accuracy circle on
// ABOUTME: the MapLibre map. Mirrors MapLibre's own Web Mercator scale constants
// ABOUTME: (512px tiles, mean earth radius) so the circle matches the map's projection.

const EARTH_RADIUS_METERS = 6371008.8
const EARTH_CIRCUMFERENCE_METERS = 2 * Math.PI * EARTH_RADIUS_METERS
const TILE_SIZE_PX = 512

/** Meters spanned by one screen pixel at the given latitude and zoom (Web Mercator). */
export function metersPerPixel(latitude: number, zoom: number): number {
  const worldSizePx = TILE_SIZE_PX * 2 ** zoom
  return (EARTH_CIRCUMFERENCE_METERS * Math.cos((latitude * Math.PI) / 180)) / worldSizePx
}

/** Pixel radius of a circle whose real-world radius is `accuracyMeters`. */
export function accuracyRadiusPixels(
  accuracyMeters: number,
  latitude: number,
  zoom: number,
): number {
  return accuracyMeters / metersPerPixel(latitude, zoom)
}
