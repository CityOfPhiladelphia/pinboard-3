// ABOUTME: Browser-side photo helpers — resize for the classifier and convert
// ABOUTME: to base64. Mirrors mobile constants (1024px max, JPEG q=0.6).

const MAX_DIMENSION = 1024
const JPEG_QUALITY = 0.6

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

export function resizeToJpegDataUrl(
  img: HTMLImageElement,
  maxDimension = MAX_DIMENSION,
  quality = JPEG_QUALITY,
): string {
  const longest = Math.max(img.width, img.height)
  const scale = longest > maxDimension ? maxDimension / longest : 1
  const targetW = Math.round(img.width * scale)
  const targetH = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(img, 0, 0, targetW, targetH)
  return canvas.toDataURL('image/jpeg', quality)
}

export async function processForClassify(file: File): Promise<string> {
  const dataUrl = await readAsDataUrl(file)
  const img = await loadImage(dataUrl)
  return resizeToJpegDataUrl(img)
}
