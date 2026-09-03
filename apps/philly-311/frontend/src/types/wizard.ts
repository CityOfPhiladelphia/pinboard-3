// ABOUTME: Shared types for the report submission wizard.
// ABOUTME: Mirrors the API submit payload shape and the per-step form data.

import type { PinboardTypes } from '@pinboard/ui'
import type { Issue } from './api'
import type { Service } from './app'

export interface PhotoAsset {
  /** CloudFront URL returned by /classify (which doubles as the upload endpoint). */
  mediaUrl?: string
  /** Local preview URL (object URL) for the thumbnail before submit. */
  previewUrl?: string
  dimensions: PinboardTypes.Dimensions
}

export interface ContactInfo {
  name?: string
  email?: string
  phone?: string
}

export interface AisFeature {
  streetAddress: string
  zipCode?: string
  lat: number
  lng: number
}

/** A photo-classification suggestion from /classify. */
export interface PhotoSuggestion {
  serviceType: Service
  confidence: number
}

/** Shape of the POST /private/key/submit body. */
export interface SubmitPayload {
  serviceRequestType: string
  description: string
  /** Required by the API: true unless the user opted into public visibility. */
  private: boolean
  address: string
  zipCode?: string
  latitude: number
  longitude: number
  mediaUrl?: string
  customFields?: Record<string, string>
}

/** The POST /private/key/submit success response — the full created Issue. */
export type SubmitResponse = Issue

/** The submitted report kept for the confirmation page, which renders it via
 *  ReportDetailContent alongside the map/my-requests detail panel. */
export type SubmittedReport = Issue

/** A locally saved, resumable snapshot of an in-progress report. */
export interface ReportDraft {
  id: string
  savedAt: string
  category: Service | undefined
  customFields: Record<string, string>
  location: AisFeature | null
  description: string
  contact: ContactInfo
  publicVisibility: boolean
  /** Uploaded photo URL only — blob preview URLs don't survive reload. */
  mediaUrl?: string
}
