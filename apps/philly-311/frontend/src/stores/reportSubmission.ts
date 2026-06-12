// ABOUTME: Pinia store for the multi-step report submission wizard.
// ABOUTME: Holds category, custom-field answers, location, photo, description,
// ABOUTME: contact info, and privacy. Builds the API submit payload on demand.
import { defineStore } from 'pinia'
import type {
  ContactInfo,
  PhotoAsset,
  PhotoSuggestion,
  SubmitPayload,
  SubmittedReport,
  WizardLocation,
} from '@/types/wizard'

interface State {
  category: string | null
  customFields: Record<string, string>
  location: WizardLocation | null
  description: string
  photo: PhotoAsset | null
  contact: ContactInfo
  /** When true, the report is publicly visible. Default false (matches mobile). */
  publicVisibility: boolean
  photoSuggestions: PhotoSuggestion[]
  submitted: SubmittedReport | null
}

const initial = (): State => ({
  category: null,
  customFields: {},
  location: null,
  description: '',
  photo: null,
  contact: {},
  publicVisibility: false,
  photoSuggestions: [],
  submitted: null,
})

export const useReportSubmissionStore = defineStore('reportSubmission', {
  state: initial,
  getters: {
    isEmpty: (s): boolean =>
      !s.category &&
      Object.keys(s.customFields).length === 0 &&
      !s.location &&
      !s.description &&
      !s.photo &&
      !s.contact.name &&
      !s.contact.email &&
      !s.contact.phone &&
      !s.publicVisibility,
  },
  actions: {
    setCategory(category: string | null) {
      // Clear customFields when category changes — answers don't carry across types.
      if (this.category !== category) this.customFields = {}
      this.category = category
    },
    setQuestion(field: string, value: string) {
      if (value === '' || value === undefined || value === null) {
        this.customFields = Object.fromEntries(
          Object.entries(this.customFields).filter(([key]) => key !== field),
        )
      } else {
        this.customFields = { ...this.customFields, [field]: value }
      }
    },
    setLocation(location: WizardLocation | null) {
      this.location = location
    },
    setPhotoSuggestions(suggestions: PhotoSuggestion[]) {
      this.photoSuggestions = suggestions
    },
    setPhoto(photo: PhotoAsset | null) {
      // Revoke the previous blob URL so the underlying File can be GC'd.
      // Browsers hold the blob alive until revoke or page unload.
      const prev = this.photo?.previewUrl
      if (prev && prev.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(prev)
      }
      this.photo = photo
    },
    setDescription(description: string) {
      this.description = description
    },
    setContact(contact: ContactInfo) {
      this.contact = { ...this.contact, ...contact }
    },
    setPrivacy(publicVisibility: boolean) {
      this.publicVisibility = publicVisibility
    },
    reset() {
      this.setPhoto(null)
      // Function form: the object form deep-merges plain objects, which would
      // leave customFields/contact entries behind.
      this.$patch((state) => {
        Object.assign(state, initial())
      })
    },
    /** Record a successful submit and clear the wizard for a fresh report. */
    recordSubmission(result: SubmittedReport) {
      this.setPhoto(null)
      this.$patch((state) => {
        Object.assign(state, initial(), { submitted: result })
      })
    },
    /** Build the API submit payload. Throws if required fields are missing. */
    payload(): SubmitPayload {
      if (!this.category) throw new Error('category is required')
      if (!this.location) throw new Error('location is required')
      if (!this.description) throw new Error('description is required')
      const body: SubmitPayload = {
        serviceRequestType: this.category,
        description: this.description,
        private: !this.publicVisibility,
        address: this.location.address,
        latitude: this.location.lat,
        longitude: this.location.lng,
      }
      if (this.location.zipCode) body.zipCode = this.location.zipCode
      if (this.photo?.mediaUrl) body.mediaUrl = this.photo.mediaUrl
      if (Object.keys(this.customFields).length > 0) {
        body.customFields = { ...this.customFields }
      }
      return body
    },
  },
})
