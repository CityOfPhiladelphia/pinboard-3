// ABOUTME: Smoke tests for the photo helpers. jsdom-friendly.
import { describe, expect, it, vi, afterEach } from 'vitest'
import { resizeToJpegDataUrl, resizeImageFileToDataURL } from '../photo'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('resizeToJpegDataUrl', () => {
  it('returns a data URL when canvas is available', () => {
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      toDataURL: vi.fn(() => 'data:image/jpeg;base64,XYZ'),
    }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(
      fakeCanvas as unknown as HTMLCanvasElement,
    )

    const fakeImg = { width: 4096, height: 3072 } as unknown as HTMLImageElement
    const result = resizeToJpegDataUrl(fakeImg)

    expect(result).toBe('data:image/jpeg;base64,XYZ')
    expect(fakeCanvas.width).toBe(1024)
    expect(fakeCanvas.height).toBe(768)
    expect(fakeCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.6)
  })

  it('does not upscale a small image', () => {
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      toDataURL: vi.fn(() => 'data:image/jpeg;base64,XYZ'),
    }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(
      fakeCanvas as unknown as HTMLCanvasElement,
    )

    const fakeImg = { width: 200, height: 150 } as unknown as HTMLImageElement
    resizeToJpegDataUrl(fakeImg)
    expect(fakeCanvas.width).toBe(200)
    expect(fakeCanvas.height).toBe(150)
  })
})

describe('resizeImageFileToDataURL', () => {
  it('reads the file, loads it as an image, and resizes/re-encodes it as JPEG', async () => {
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      toDataURL: vi.fn(() => 'data:image/jpeg;base64,RESIZED'),
    }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(
      fakeCanvas as unknown as HTMLCanvasElement,
    )

    class FakeImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      width = 2000
      height = 1000
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('Image', FakeImage)

    const file = new Blob(['fake-image-bytes'], { type: 'image/jpeg' })
    const result = await resizeImageFileToDataURL(file)

    expect(result).toBe('data:image/jpeg;base64,RESIZED')
    expect(fakeCanvas.width).toBe(1024)
    expect(fakeCanvas.height).toBe(512)
  })

  it('rejects when the image fails to load', async () => {
    class FakeImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.())
      }
    }
    vi.stubGlobal('Image', FakeImage)

    const file = new Blob(['not-really-an-image'], { type: 'image/jpeg' })
    await expect(resizeImageFileToDataURL(file)).rejects.toThrow(
      'Failed to load the selected image',
    )
  })
})
