import type { PhotoAsset } from '@/types/wizard'

const CLOUDFRONT_URL = 'https://dmg8fc7rypu31.cloudfront.net/images/'

export function encodePhotoInfo(photo: PhotoAsset) {
  return `${photo.dimensions.height}[${photo.dimensions.width}[${photo.mediaUrl?.match(/(?<=images\/).*(?=.jpg)/)}`
}

export function decodePhotoInfo(str: string): PhotoAsset {
  const splitStr = str.split('[')
  return {
    dimensions: {
      height: Number(splitStr[0]),
      width: Number(splitStr[1]),
    },
    mediaUrl: `${CLOUDFRONT_URL}${splitStr[2]}.jpg`,
  }
}
