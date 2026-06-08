// ABOUTME: Shared types for the report submission wizard.
// ABOUTME: Mirrors the API submit payload shape and the per-step form data.

export interface LocationCoordinates {
  latitude: number
  longitude: number
}

export interface PhotoAsset {
  /** CloudFront URL returned by /classify (which doubles as the upload endpoint). */
  mediaUrl: string
  /** Local preview URL (object URL) for the thumbnail before submit. */
  previewUrl?: string
}

export interface ContactInfo {
  name?: string
  email?: string
  phone?: string
}

export interface WizardLocation {
  address: string
  zipCode?: string
  lat: number
  lng: number
}

/** Shape of the POST /private/key/submit body. */
export interface SubmitPayload {
  serviceRequestType: string
  description: string
  address: string
  zipCode?: string
  latitude: number
  longitude: number
  mediaUrl?: string
  customFields?: Record<string, string>
}
