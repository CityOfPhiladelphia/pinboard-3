import type { PhotoAsset } from '@/types/wizard'

const CLOUDFRONT_URL = 'https://dmg8fc7rypu31.cloudfront.net/images/'

export function encodePhotoInfo(photo: PhotoAsset) {
  return `${photo.dimensions.height}[${photo.dimensions.width}[${photo.mediaUrl?.match(/(?<=images\/).*(?=.jpg)/)}${photo.location?.streetAddress ? `[${photo.location.streetAddress}` : ''}${photo.location?.zipCode ? `[${photo.location.zipCode}` : ''}${photo.location?.lat ? `[${photo.location.lat}` : ''}${photo.location?.lng ? `[${photo.location.lng}` : ''}`
}

export function decodePhotoInfo(str: string): PhotoAsset {
  const splitStr = str.split('[')
  return {
    dimensions: {
      height: Number(splitStr[0]),
      width: Number(splitStr[1]),
    },
    mediaUrl: `${CLOUDFRONT_URL}${splitStr[2]}.jpg`,
    location: {
      streetAddress: splitStr?.[3],
      zipCode: splitStr?.[4],
      lat: Number(splitStr?.[5]),
      lng: Number(splitStr?.[6]),
    },
  }
}
