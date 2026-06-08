// ABOUTME: Smoke tests for the photo helpers. jsdom-friendly.
import { describe, expect, it, vi } from 'vitest'
import { resizeToJpegDataUrl } from './photo'

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
