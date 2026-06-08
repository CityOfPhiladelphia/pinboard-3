// ABOUTME: Tests for the geolocation wrapper — success, denial, and
// ABOUTME: unavailable navigator.geolocation cases all resolve (never throw).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { getCurrentPosition } from './useGeolocation'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getCurrentPosition', () => {
  it('resolves with lat/lng when geolocation succeeds', async () => {
    const mockPosition = {
      coords: { latitude: 39.9526, longitude: -75.1652 },
    } as GeolocationPosition

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((success: PositionCallback) => {
          success(mockPosition)
        }),
      },
    })

    const result = await getCurrentPosition()
    expect(result).toEqual({ lat: 39.9526, lng: -75.1652 })
  })

  it('resolves null when geolocation is denied', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((_success: PositionCallback, error: PositionErrorCallback) => {
          error({ code: 1, message: 'User denied Geolocation' } as GeolocationPositionError)
        }),
      },
    })

    const result = await getCurrentPosition()
    expect(result).toBeNull()
  })

  it('resolves null when navigator.geolocation is not available', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: undefined,
    })

    const result = await getCurrentPosition()
    expect(result).toBeNull()
  })
})
