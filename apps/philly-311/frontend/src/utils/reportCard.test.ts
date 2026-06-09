import { describe, it, expect } from 'vitest'
import { reportToLocation, statusTagColor } from './reportCard'
import type { Report } from '@/composables/useNearbyReports'

const base: Report = {
  id: '12345678',
  caseNumber: '12345678',
  lat: 39.95,
  lng: -75.16,
  serviceType: 'Pothole Repair',
  status: 'In Progress',
  address: '1234 Market St',
  mediaUrl: 'https://example.test/p.jpg',
  description: 'big pothole',
  distance: 161,
}

describe('reportToLocation', () => {
  it('maps Report fields onto BasicLocation + MapCardProps', () => {
    const loc = reportToLocation(base)
    expect(loc.id).toBe('12345678')
    expect(loc.latitude).toBe(39.95)
    expect(loc.longitude).toBe(-75.16)
    expect(loc.locationCardInfo.heading).toBe('Pothole Repair')
    expect(loc.locationCardInfo.subheader).toBe('1234 Market St')
    expect(loc.locationCardInfo.src).toBe('https://example.test/p.jpg')
    const tags = loc.locationCardInfo.tags ?? []
    expect(tags[0]?.text).toBe('In Progress')
    expect(tags.some((t) => t.text === '0.1 mi')).toBe(true)
  })
  it('omits the distance tag when distance is missing', () => {
    const tags = reportToLocation({ ...base, distance: NaN }).locationCardInfo.tags ?? []
    expect(tags.some((t) => t.text?.endsWith('mi') || t.text?.endsWith('ft'))).toBe(false)
  })
})

describe('statusTagColor', () => {
  it('maps known statuses and defaults to grey', () => {
    expect(statusTagColor('In Progress')).toBe('purple')
    expect(statusTagColor('Closed')).toBe('green')
    expect(statusTagColor('whatever')).toBe('grey')
  })
})
