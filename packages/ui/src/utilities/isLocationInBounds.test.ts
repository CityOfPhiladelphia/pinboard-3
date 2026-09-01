import { describe, it, expect } from 'vitest'
import { isLocationInBounds } from './isLocationInBounds'

const bounds = { west: -75.2, south: 39.9, east: -75.1, north: 40.0 }

describe('isLocationInBounds', () => {
  it('is true for a point inside the bounds', () => {
    expect(isLocationInBounds({ latitude: 39.95, longitude: -75.15 }, bounds)).toBe(true)
  })

  it('is inclusive of points exactly on an edge', () => {
    expect(isLocationInBounds({ latitude: 39.9, longitude: -75.15 }, bounds)).toBe(true)
    expect(isLocationInBounds({ latitude: 40.0, longitude: -75.15 }, bounds)).toBe(true)
    expect(isLocationInBounds({ latitude: 39.95, longitude: -75.2 }, bounds)).toBe(true)
    expect(isLocationInBounds({ latitude: 39.95, longitude: -75.1 }, bounds)).toBe(true)
  })

  it('is false for a point outside latitude range', () => {
    expect(isLocationInBounds({ latitude: 40.1, longitude: -75.15 }, bounds)).toBe(false)
    expect(isLocationInBounds({ latitude: 39.8, longitude: -75.15 }, bounds)).toBe(false)
  })

  it('is false for a point outside longitude range', () => {
    expect(isLocationInBounds({ latitude: 39.95, longitude: -75.3 }, bounds)).toBe(false)
    expect(isLocationInBounds({ latitude: 39.95, longitude: -75.0 }, bounds)).toBe(false)
  })
})
