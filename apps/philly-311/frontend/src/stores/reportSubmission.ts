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
import { charCodeToString, stringToCharCode } from '@pinboard/core'
import type { LocationQuery } from 'vue-router'
import type { PinboardTypes } from '@pinboard/ui'
import { decodePhotoInfo, encodePhotoInfo } from '@/utils/encodeDecodePhoto'

interface State {
  category: string | null
  customFields: Record<string, string>
  location: WizardLocation | null
  description: string
  photo: PhotoAsset
  contact: ContactInfo
  /** When true, the report is publicly visible. Default false (matches mobile). */
  publicVisibility: boolean
  photoSuggestions: PhotoSuggestion[]
  submitted: SubmittedReport | null
}

interface T extends LocationQuery {
  c: string
  cf: string
  l: string
  d: string
  p: string
  co: string
  pv: string
  ps: string
}

type QueryParams = Pick<T, 'c' | 'cf' | 'l' | 'd' | 'p' | 'co' | 'pv' | 'ps'>

const initial = (): State => ({
  category: null,
  customFields: {},
  location: null,
  description: '',
  photo: {
    dimensions: {
      height: 1,
      width: 1,
    },
  },
  contact: {},
  publicVisibility: false,
  photoSuggestions: [],
  submitted: null,
})

export const useReportSubmissionStore = defineStore('reportSubmission', {
  state: initial,
  actions: {
    setCategory(category: string | null) {
      // Clear customFields when category changes — answers don't carry across types.
      if (this.category !== category) this.customFields = {}
      this.category = category
    },
    setQuestion(field: string, value: string) {
      if (!value) {
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
    setPhoto(photo: string | undefined) {
      this.photo.mediaUrl = photo
    },
    setPhotoPreview(photo: string | undefined) {
      // Revoke the previous blob URL so the underlying File can be GC'd.
      // Browsers hold the blob alive until revoke or page unload.
      const prev = this.photo.previewUrl
      if (prev && prev.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(prev)
      }
      this.photo.previewUrl = photo
    },
    setPhotoDimensions(dimensions: PinboardTypes.Dimensions) {
      this.photo.dimensions = dimensions
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
    resetPhoto() {
      this.setPhoto(undefined)
      this.setPhotoPreview(undefined)
      this.setPhotoDimensions({
        height: 1,
        width: 1,
      })
    },
    reset() {
      this.resetPhoto()
      // Function form: the object form deep-merges plain objects, which would
      // leave customFields/contact entries behind.
      this.$patch((state) => {
        Object.assign(state, initial())
      })
    },
    /** Record a successful submit and clear the wizard for a fresh report. */
    recordSubmission(result: SubmittedReport) {
      this.resetPhoto()
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
    stateToUrlQueryParams(): string {
      const stateUrl: (string | null)[] = Array.from(
        Object.entries(this.$state),
        ([storeKey, storeValue]) => {
          switch (storeKey as keyof State) {
            case 'category': {
              return storeValue ? `c=${encodeURIComponent(storeValue)}` : null
            }
            case 'customFields': {
              return Object.keys(storeValue).length
                ? `cf=${stringToCharCode(JSON.stringify(storeValue))}`
                : null
            }
            case 'location': {
              return storeValue ? `l=${stringToCharCode(JSON.stringify(storeValue))}` : null
            }
            case 'description': {
              return Object.keys(storeValue).length
                ? `d=${stringToCharCode(JSON.stringify(storeValue))}`
                : null
            }
            case 'photo': {
              return storeValue ? `p=${stringToCharCode(encodePhotoInfo(storeValue))}` : null
            }
            case 'contact': {
              return Object.keys(storeValue).length
                ? `co=${stringToCharCode(JSON.stringify(storeValue))}`
                : null
            }
            case 'publicVisibility': {
              return storeValue ? 'pv=t' : null
            }
            case 'photoSuggestions': {
              return Object.keys(storeValue).length
                ? `ps=${stringToCharCode(JSON.stringify(storeValue))}`
                : null
            }
            case 'submitted': {
              return null
            }
          }
        },
      )
      return stateUrl.filter(Boolean).join('&')
    },
    urlQueryParamsToState(params: LocationQuery) {
      Object.entries(params as QueryParams).forEach(([queryKey, queryValue]) => {
        switch (queryKey as keyof QueryParams) {
          case 'c': {
            this.category = decodeURIComponent(queryValue)
            break
          }
          case 'cf': {
            this.customFields = JSON.parse(charCodeToString(queryValue))
            break
          }
          case 'l': {
            this.location = JSON.parse(charCodeToString(queryValue))
            break
          }
          case 'd': {
            this.description = JSON.parse(charCodeToString(queryValue))
            break
          }
          case 'p': {
            this.photo = decodePhotoInfo(charCodeToString(queryValue))
            break
          }
          case 'co': {
            this.contact = JSON.parse(charCodeToString(queryValue))
            break
          }
          case 'pv': {
            this.publicVisibility = true
            break
          }
          case 'ps': {
            this.photoSuggestions = JSON.parse(charCodeToString(queryValue))
            break
          }
        }
      })
    },
  },
})
