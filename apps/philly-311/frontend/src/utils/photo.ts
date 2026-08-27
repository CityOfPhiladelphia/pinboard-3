// ABOUTME: Browser-side photo helpers — resize for the classifier and convert
// ABOUTME: to base64. Mirrors mobile constants (1024px max, JPEG q=0.6).

import type { PinboardTypes } from '@pinboard/ui'

export const MAX_DIMENSION = 1024
export const JPEG_QUALITY = 0.6

export function resizeImageToMax(img: PinboardTypes.Dimensions): PinboardTypes.Dimensions {
  const longest = Math.max(img.width, img.height)
  const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1
  return {
    height: Math.round(img.height * scale),
    width: Math.round(img.width * scale),
  }
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (_e) => resolve(reader.result as string)
    reader.onerror = (_e) => reject(reader.error)
    reader.onabort = (_e) => reject(new Error('Read aborted'))
    reader.readAsDataURL(blob)
  })
}
