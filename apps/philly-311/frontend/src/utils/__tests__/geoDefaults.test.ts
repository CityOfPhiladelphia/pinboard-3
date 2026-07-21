// ABOUTME: Tests for geoDefaults — geographic seed constants for nearby-report searches.
import { describe, it, expect } from 'vitest'
import { CITYWIDE_RADIUS, DEFAULT_CENTER } from '../geoDefaults'

describe('geoDefaults', () => {
  it('exposes a city-wide radius covering Philadelphia', () => {
    expect(CITYWIDE_RADIUS).toBe(60000)
  })
  it('keeps the existing seed defaults', () => {
    expect(typeof DEFAULT_CENTER.lat).toBe('number')
  })
})
