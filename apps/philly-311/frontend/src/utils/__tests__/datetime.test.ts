// ABOUTME: Tests for formatCardTimestamp — report-card date line formatting.
import { describe, it, expect } from 'vitest'
import { formatCardTimestamp } from '../datetime'

describe('formatCardTimestamp', () => {
  it('formats an ISO timestamp as MM/DD/YY • h:mm AM', () => {
    // Built from local-time components so the assertion is timezone-stable.
    const iso = new Date(2026, 9, 10, 10, 41).toISOString()
    expect(formatCardTimestamp(iso)).toBe('10/10/26 • 10:41 AM')
  })

  it('handles PM and zero-pads single-digit month/day', () => {
    const iso = new Date(2026, 0, 5, 15, 5).toISOString()
    expect(formatCardTimestamp(iso)).toBe('01/05/26 • 3:05 PM')
  })

  it('returns null for missing or invalid input', () => {
    expect(formatCardTimestamp(undefined)).toBeNull()
    expect(formatCardTimestamp(null)).toBeNull()
    expect(formatCardTimestamp('not-a-date')).toBeNull()
  })
})
