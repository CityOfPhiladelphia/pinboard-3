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

/** Draws an already-loaded image onto a canvas at MAX_DIMENSION and re-encodes it as JPEG. */
export function resizeToJpegDataUrl(img: HTMLImageElement): string {
  const { width, height } = resizeImageToMax(img)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Failed to get a 2D canvas context')
  context.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load the selected image'))
    img.src = dataUrl
  })
}

/** Full pipeline for a user-picked file (e.g. a comment's attached photo): read it,
 *  resize to MAX_DIMENSION, and re-encode as JPEG — matching mobile's constants exactly. */
export async function resizeImageFileToDataURL(file: Blob): Promise<string> {
  const original = await blobToDataURL(file)
  const img = await loadImage(original)
  return resizeToJpegDataUrl(img)
}
