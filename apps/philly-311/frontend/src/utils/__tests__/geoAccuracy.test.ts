// ABOUTME: Tests for geoAccuracy — the meters-to-pixels math that sizes the
// ABOUTME: geolocation accuracy circle drawn on the map.
import { describe, it, expect } from 'vitest'
import { metersPerPixel, accuracyRadiusPixels } from '../geoAccuracy'

describe('metersPerPixel', () => {
  it('matches the Web Mercator scale at the equator, zoom 0', () => {
    expect(metersPerPixel(0, 0)).toBeCloseTo(78184.0408, 3)
  })

  it('halves for each zoom level increment', () => {
    expect(metersPerPixel(0, 1)).toBeCloseTo(metersPerPixel(0, 0) / 2, 6)
    expect(metersPerPixel(0, 16)).toBeCloseTo(metersPerPixel(0, 0) / 2 ** 16, 6)
  })

  it('shrinks away from the equator by cos(latitude)', () => {
    const atEquator = metersPerPixel(0, 14)
    const atPhilly = metersPerPixel(39.95, 14)
    expect(atPhilly).toBeCloseTo(atEquator * Math.cos((39.95 * Math.PI) / 180), 9)
    expect(atPhilly).toBeLessThan(atEquator)
  })

  it('is symmetric for north/south latitude', () => {
    expect(metersPerPixel(39.95, 14)).toBeCloseTo(metersPerPixel(-39.95, 14), 9)
  })
})

describe('accuracyRadiusPixels', () => {
  it('converts a meters accuracy radius to a pixel radius at a given latitude/zoom', () => {
    expect(accuracyRadiusPixels(10, 39.95, 16)).toBeCloseTo(10.9343, 3)
  })

  it('scales linearly with accuracy', () => {
    const base = accuracyRadiusPixels(10, 39.95, 16)
    expect(accuracyRadiusPixels(20, 39.95, 16)).toBeCloseTo(base * 2, 9)
  })

  it('grows as zoom increases (same real-world radius covers more pixels)', () => {
    expect(accuracyRadiusPixels(25, 39.95, 17)).toBeGreaterThan(accuracyRadiusPixels(25, 39.95, 16))
  })
})
