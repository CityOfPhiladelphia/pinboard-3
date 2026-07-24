import { describe, it, expect } from 'vitest'
import { reportToLocation, statusIconTreatment, statusBucket } from '../reportCard'
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

describe('statusIconTreatment', () => {
  it('treats Closed and Resolved as resolved', () => {
    expect(statusIconTreatment('Closed')).toBe('resolved')
    expect(statusIconTreatment('Resolved')).toBe('resolved')
  })

  it('treats New, Open, and In Progress as open', () => {
    expect(statusIconTreatment('New')).toBe('open')
    expect(statusIconTreatment('Open')).toBe('open')
    expect(statusIconTreatment('In Progress')).toBe('open')
  })

  it('returns null for missing status', () => {
    expect(statusIconTreatment('')).toBeNull()
    expect(statusIconTreatment(undefined)).toBeNull()
    expect(statusIconTreatment(null)).toBeNull()
  })
})

describe('statusBucket', () => {
  it.each([
    ['Resolved', 'resolved'],
    ['Closed', 'closed'],
    ['New', 'inProgress'],
    ['In Progress', 'inProgress'],
    ['Anything Else', 'inProgress'],
  ])('buckets %s as %s', (status, bucket) => {
    expect(statusBucket(status)).toBe(bucket)
  })
})
