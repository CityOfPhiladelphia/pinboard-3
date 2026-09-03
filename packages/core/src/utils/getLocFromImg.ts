import { gps } from 'exifr'
import type { LatLon } from '../types'

export async function getImgLocationInfo(image: File): Promise<LatLon> {
  if (!(image && /^image\//.test(image?.type))) {
    throw new Error(`Input was not an image: ${image}`)
  }
  const location: LatLon = {
    latitude: NaN,
    longitude: NaN,
  }
  const coords = await gps(image)

  if (coords.latitude && coords.longitude) {
    location.latitude = coords.latitude
    location.longitude = coords.longitude
  }

  return location
}
