// ABOUTME: API response types for the 311 service request API.
// ABOUTME: These mirror the shapes returned by /private/key/service-types and related endpoints.

import type { Service } from './app'

export interface IQuestionField {
  field: string
  label: string
  type: string
  required: boolean
  options?: string[]
  controllerName?: string
  dependentValues?: Record<string, string[]>
  description: string
}

export interface ServiceType {
  serviceType: Service
  caseType: string
  description: string
  recordTypeID: string
  department: string
  questions: IQuestionField[]
}

/** An answer to one of a service type's follow-up questions, as returned on an Issue. */
export interface CustomFieldValue {
  field: string
  label: string
  type: string
  value: string | null
  options?: string[]
}

/** Mirrors the API's Issue shape (GET /issues/:id, POST /submit, POST /issues/:id/upvote).
 *  Fields are optional here because callers may build a partial Issue from lighter-weight
 *  data (e.g. a nearby-issues Report) before the full record has loaded. */
export interface Issue {
  id: string
  caseNumber?: string
  status?: string
  serviceType?: Service
  department?: string
  private?: boolean
  address?: string
  description?: string
  mediaUrl?: string
  latitude?: number
  longitude?: number
  createdAt?: string
  updatedAt?: string
  slaDate?: string
  slaDays?: number
  childCount?: number
  customFields?: CustomFieldValue[]
}
