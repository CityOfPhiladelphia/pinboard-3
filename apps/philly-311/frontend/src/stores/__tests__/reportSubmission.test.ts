// ABOUTME: Tests for the report submission Pinia store.
// ABOUTME: Covers state mutations, isEmpty getter, payload builder, and recordSubmission.
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReportSubmissionStore } from '../reportSubmission'

describe('useReportSubmissionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('isEmpty is true with default state', () => {
      const store = useReportSubmissionStore()
      expect(store.isEmpty).toBe(true)
    })

    it('has correct default field values', () => {
      const store = useReportSubmissionStore()
      expect(store.category).toBeNull()
      expect(store.customFields).toEqual({})
      expect(store.location).toBeNull()
      expect(store.description).toBe('')
      expect(store.photo).toBeNull()
      expect(store.contact).toEqual({})
      expect(store.publicVisibility).toBe(false)
    })
  })

  describe('setCategory', () => {
    it('sets category', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      expect(store.category).toBe('Pothole Repair')
    })

    it('clears customFields when category changes', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setQuestion('severity', 'high')
      store.setCategory('Graffiti Removal')
      expect(store.customFields).toEqual({})
    })

    it('preserves customFields when setting the same category', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setQuestion('severity', 'high')
      store.setCategory('Pothole Repair')
      expect(store.customFields).toEqual({ severity: 'high' })
    })

    it('sets category to null', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setCategory(null)
      expect(store.category).toBeNull()
    })
  })

  describe('setQuestion', () => {
    it('adds a custom field', () => {
      const store = useReportSubmissionStore()
      store.setQuestion('severity', 'high')
      expect(store.customFields).toEqual({ severity: 'high' })
    })

    it('replaces an existing custom field', () => {
      const store = useReportSubmissionStore()
      store.setQuestion('severity', 'high')
      store.setQuestion('severity', 'low')
      expect(store.customFields).toEqual({ severity: 'low' })
    })

    it('deletes the key when value is empty string', () => {
      const store = useReportSubmissionStore()
      store.setQuestion('severity', 'high')
      store.setQuestion('severity', '')
      expect(store.customFields).toEqual({})
    })

    it('can hold multiple fields independently', () => {
      const store = useReportSubmissionStore()
      store.setQuestion('severity', 'high')
      store.setQuestion('location_type', 'sidewalk')
      expect(store.customFields).toEqual({ severity: 'high', location_type: 'sidewalk' })
    })
  })

  describe('setLocation', () => {
    it('sets location', () => {
      const store = useReportSubmissionStore()
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      expect(store.location).toEqual({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
    })

    it('sets location to null', () => {
      const store = useReportSubmissionStore()
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      store.setLocation(null)
      expect(store.location).toBeNull()
    })
  })

  describe('setPhoto', () => {
    it('sets photo', () => {
      const store = useReportSubmissionStore()
      store.setPhoto({ mediaUrl: 'https://cdn.example.com/photo.jpg', previewUrl: 'blob:123' })
      expect(store.photo).toEqual({
        mediaUrl: 'https://cdn.example.com/photo.jpg',
        previewUrl: 'blob:123',
      })
    })

    it('sets photo to null', () => {
      const store = useReportSubmissionStore()
      store.setPhoto({ mediaUrl: 'https://cdn.example.com/photo.jpg' })
      store.setPhoto(null)
      expect(store.photo).toBeNull()
    })
  })

  describe('setDescription', () => {
    it('sets description', () => {
      const store = useReportSubmissionStore()
      store.setDescription('Large pothole near the bus stop')
      expect(store.description).toBe('Large pothole near the bus stop')
    })
  })

  describe('setContact', () => {
    it('sets contact fields', () => {
      const store = useReportSubmissionStore()
      store.setContact({ name: 'Jane Doe', email: 'jane@example.com' })
      expect(store.contact).toEqual({ name: 'Jane Doe', email: 'jane@example.com' })
    })

    it('merges contact fields across multiple calls', () => {
      const store = useReportSubmissionStore()
      store.setContact({ name: 'Jane Doe' })
      store.setContact({ email: 'jane@example.com' })
      expect(store.contact).toEqual({ name: 'Jane Doe', email: 'jane@example.com' })
    })

    it('overwrites existing fields on subsequent calls', () => {
      const store = useReportSubmissionStore()
      store.setContact({ name: 'Jane Doe' })
      store.setContact({ name: 'John Smith' })
      expect(store.contact.name).toBe('John Smith')
    })
  })

  describe('setPrivacy', () => {
    it('sets publicVisibility', () => {
      const store = useReportSubmissionStore()
      store.setPrivacy(true)
      expect(store.publicVisibility).toBe(true)
    })
  })

  describe('reset', () => {
    it('returns all fields to initial state', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setDescription('Big hole')
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      store.setPrivacy(true)
      store.reset()
      expect(store.category).toBeNull()
      expect(store.description).toBe('')
      expect(store.location).toBeNull()
      expect(store.publicVisibility).toBe(false)
    })

    it('isEmpty is true after reset', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.reset()
      expect(store.isEmpty).toBe(true)
    })

    it('clears customFields and contact', () => {
      const store = useReportSubmissionStore()
      store.setQuestion('Color__c', 'Red')
      store.setContact({ name: 'Darren', email: 'd@example.com' })
      store.reset()
      expect(store.customFields).toEqual({})
      expect(store.contact).toEqual({})
    })

    it('clears submitted', () => {
      const store = useReportSubmissionStore()
      store.recordSubmission({ id: 'a1' })
      store.reset()
      expect(store.submitted).toBeNull()
    })
  })

  describe('isEmpty', () => {
    it('turns false when category is set', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      expect(store.isEmpty).toBe(false)
    })

    it('turns false when description is set', () => {
      const store = useReportSubmissionStore()
      store.setDescription('some text')
      expect(store.isEmpty).toBe(false)
    })

    it('turns false when location is set', () => {
      const store = useReportSubmissionStore()
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      expect(store.isEmpty).toBe(false)
    })

    it('turns false when photo is set', () => {
      const store = useReportSubmissionStore()
      store.setPhoto({ mediaUrl: 'https://cdn.example.com/photo.jpg' })
      expect(store.isEmpty).toBe(false)
    })

    it('turns false when contact name is set', () => {
      const store = useReportSubmissionStore()
      store.setContact({ name: 'Jane' })
      expect(store.isEmpty).toBe(false)
    })

    it('turns false when contact email is set', () => {
      const store = useReportSubmissionStore()
      store.setContact({ email: 'jane@example.com' })
      expect(store.isEmpty).toBe(false)
    })

    it('turns false when contact phone is set', () => {
      const store = useReportSubmissionStore()
      store.setContact({ phone: '555-1234' })
      expect(store.isEmpty).toBe(false)
    })

    it('turns false when publicVisibility is true', () => {
      const store = useReportSubmissionStore()
      store.setPrivacy(true)
      expect(store.isEmpty).toBe(false)
    })

    it('turns false when customFields is non-empty', () => {
      const store = useReportSubmissionStore()
      // setQuestion requires a category to be set first (setCategory clears customFields
      // on change). Set category and question, then verify isEmpty reflects the customFields.
      store.setCategory('Pothole Repair')
      store.setQuestion('severity', 'high')
      expect(Object.keys(store.customFields).length).toBeGreaterThan(0)
      expect(store.isEmpty).toBe(false)
    })
  })

  describe('payload', () => {
    it('returns the correct SubmitPayload for a happy path', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setLocation({ address: '1234 Main St', zipCode: '19107', lat: 39.95, lng: -75.16 })
      store.setDescription('Large pothole near the bus stop')

      expect(store.payload()).toEqual({
        serviceRequestType: 'Pothole Repair',
        description: 'Large pothole near the bus stop',
        private: true,
        address: '1234 Main St',
        zipCode: '19107',
        latitude: 39.95,
        longitude: -75.16,
      })
    })

    it('includes private: true by default (reports are private unless made public)', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      store.setDescription('A problem')
      expect(store.payload().private).toBe(true)
    })

    it('includes private: false after the report is made public', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      store.setDescription('A problem')
      store.setPrivacy(true)
      expect(store.payload().private).toBe(false)
    })

    it('throws when category is missing', () => {
      const store = useReportSubmissionStore()
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      store.setDescription('A problem')
      expect(() => store.payload()).toThrow('category is required')
    })

    it('throws when location is missing', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setDescription('A problem')
      expect(() => store.payload()).toThrow('location is required')
    })

    it('throws when description is missing', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      expect(() => store.payload()).toThrow('description is required')
    })

    it('omits zipCode when not set', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      store.setDescription('A problem')
      const result = store.payload()
      expect(result).not.toHaveProperty('zipCode')
    })

    it('omits mediaUrl when photo is not set', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      store.setDescription('A problem')
      const result = store.payload()
      expect(result).not.toHaveProperty('mediaUrl')
    })

    it('omits customFields when none are set', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      store.setDescription('A problem')
      const result = store.payload()
      expect(result).not.toHaveProperty('customFields')
    })

    it('includes zipCode when location has one', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setLocation({ address: '1234 Main St', zipCode: '19107', lat: 39.95, lng: -75.16 })
      store.setDescription('A problem')
      expect(store.payload().zipCode).toBe('19107')
    })

    it('includes mediaUrl when photo has one', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      store.setDescription('A problem')
      store.setPhoto({ mediaUrl: 'https://cdn.example.com/photo.jpg' })
      expect(store.payload().mediaUrl).toBe('https://cdn.example.com/photo.jpg')
    })

    it('includes customFields when present', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      store.setDescription('A problem')
      store.setQuestion('severity', 'high')
      expect(store.payload().customFields).toEqual({ severity: 'high' })
    })
  })

  it('stores and clears photo suggestions', () => {
    setActivePinia(createPinia())
    const store = useReportSubmissionStore()
    expect(store.photoSuggestions).toEqual([])
    store.setPhotoSuggestions([{ serviceType: 'Pothole Repair', confidence: 0.9 }])
    expect(store.photoSuggestions).toEqual([{ serviceType: 'Pothole Repair', confidence: 0.9 }])
    store.reset()
    expect(store.photoSuggestions).toEqual([])
  })

  describe('recordSubmission', () => {
    it('stores the id and caseNumber', () => {
      const store = useReportSubmissionStore()
      store.recordSubmission({ id: 'a1', caseNumber: '311-0042' })
      expect(store.submitted).toEqual({ id: 'a1', caseNumber: '311-0042' })
    })

    it('clears the wizard fields, including customFields and contact', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setQuestion('Severity__c', 'Deep')
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      store.setDescription('Big hole in the road')
      store.setContact({ name: 'Darren' })
      store.setPrivacy(true)
      store.setPhoto({ mediaUrl: 'https://cdn.example.com/p.jpg' })
      store.recordSubmission({ id: 'a1' })
      expect(store.category).toBeNull()
      expect(store.customFields).toEqual({})
      expect(store.location).toBeNull()
      expect(store.description).toBe('')
      expect(store.contact).toEqual({})
      expect(store.publicVisibility).toBe(false)
      expect(store.photo).toBeNull()
      expect(store.photoSuggestions).toEqual([])
      expect(store.isEmpty).toBe(true)
    })
  })

})
