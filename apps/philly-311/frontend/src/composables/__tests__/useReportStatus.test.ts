// ABOUTME: Tests for useReportStatus — the single status->bucket/color/icon/style mapping,
// ABOUTME: kept in parity with the iOS/Android apps' status treatment.
import { describe, it, expect } from 'vitest'
import { IconCircleCheck, IconClock, IconCircleExclamation } from '@phila/phila-ui-core/icons'
import { statusBucket, statusTagColor, statusTagIcon, statusTagStyle } from '../useReportStatus'

describe('statusBucket', () => {
  it('buckets Closed as closed', () => {
    expect(statusBucket('Closed')).toBe('closed')
  })

  it('buckets On Hold as onHold', () => {
    expect(statusBucket('On Hold')).toBe('onHold')
  })

  it.each([
    'New',
    'Open',
    'In-Progress',
    'Assigned',
    'Resolved', // not a real Salesforce Status value — falls to the default like mobile
    'Tagged - City Removed', // one of the many department-specific statuses
    'Anything Else',
  ])('buckets %s as open (the default, matching mobile)', (status) => {
    expect(statusBucket(status)).toBe('open')
  })

  it.each(['', null, undefined])('returns null for missing status (%s)', (status) => {
    expect(statusBucket(status)).toBeNull()
  })
})

describe('statusTagColor / statusTagIcon', () => {
  it('closed is green with a check', () => {
    expect(statusTagColor('closed')).toBe('green')
    expect(statusTagIcon('closed')).toBe(IconCircleCheck)
  })

  it('onHold is yellow with a circle-exclamation', () => {
    expect(statusTagColor('onHold')).toBe('yellow')
    expect(statusTagIcon('onHold')).toBe(IconCircleExclamation)
  })

  it('open is a clock, with a placeholder blue color (overridden by statusTagStyle)', () => {
    expect(statusTagColor('open')).toBe('blue')
    expect(statusTagIcon('open')).toBe(IconClock)
  })
})

describe('statusTagStyle', () => {
  it('resets the cursor for onHold/closed, which otherwise use FilterChip colors as-is', () => {
    expect(statusTagStyle('onHold')).toEqual({ cursor: 'default' })
    expect(statusTagStyle('closed')).toEqual({ cursor: 'default' })
  })

  it('overrides open to purple, since FilterChip has no purple in its color enum', () => {
    const style = statusTagStyle('open')
    expect(style.cursor).toBe('default')
    expect(style.backgroundColor).toContain('e5cefa')
    expect(style.color).toContain('4a00c9')
    expect(style.borderColor).toContain('4a00c9')
  })
})
