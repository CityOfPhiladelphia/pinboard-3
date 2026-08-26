import { describe, it, expect } from 'vitest'
import { reportToLocation } from '../reportCard'
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
}

describe('reportToLocation', () => {
  it('maps Report fields onto BasicLocation', () => {
    const loc = reportToLocation(base)
    expect(loc.id).toBe('12345678')
    expect(loc.name).toBe('Pothole Repair')
    expect(loc.latitude).toBe(39.95)
    expect(loc.longitude).toBe(-75.16)
    expect(loc).not.toHaveProperty('locationCardInfo')
  })
})
