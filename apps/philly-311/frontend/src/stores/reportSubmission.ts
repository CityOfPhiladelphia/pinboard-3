// ABOUTME: Pinia store for the multi-step report submission wizard.
// ABOUTME: Holds category, custom-field answers, location, photo, description,
// ABOUTME: contact info, and privacy. Builds the API submit payload on demand.
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'
import type {
  ContactInfo,
  PhotoAsset,
  PhotoSuggestion,
  SubmitPayload,
  WizardLocation,
} from '@/types/wizard'

interface SubmitResponse {
  id: string
  caseNumber?: string
  status?: string
}

interface State {
  category: string | null
  customFields: Record<string, string>
  location: WizardLocation | null
  description: string
  photo: PhotoAsset | null
  contact: ContactInfo
  /** When true, the report is publicly visible. Default false (matches mobile). */
  publicVisibility: boolean
  lastFieldErrors: Record<string, string> | null
  photoSuggestions: PhotoSuggestion[]
}

const initial = (): State => ({
  category: null,
  customFields: {},
  location: null,
  description: '',
  photo: null,
  contact: {},
  publicVisibility: false,
  lastFieldErrors: null,
  photoSuggestions: [],
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
      this.$patch(initial())
    },
    async submit(): Promise<SubmitResponse> {
      this.lastFieldErrors = null
      const body = this.payload()
      const api = useApi<SubmitResponse>({
        url: '/private/key/submit',
        method: 'POST',
        body,
      })
      const result = await api.fetchData()
      if (api.error.value) {
        if (api.error.value.fieldErrors) this.lastFieldErrors = api.error.value.fieldErrors
        throw api.error.value
      }
      if (!result) throw new Error('Submit returned no data')
      return result
    },
    /** Build the API submit payload. Throws if required fields are missing. */
    payload(): SubmitPayload {
      if (!this.category) throw new Error('category is required')
      if (!this.location) throw new Error('location is required')
      if (!this.description) throw new Error('description is required')
      const body: SubmitPayload = {
        serviceRequestType: this.category,
        description: this.description,
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
