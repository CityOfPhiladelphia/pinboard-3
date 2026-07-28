// ABOUTME: API response types for the 311 service request API.
// ABOUTME: These mirror the shapes returned by /private/key/service-types and related endpoints.

export interface QuestionField {
  field: string
  label: string
  type: string
  required: boolean
  options?: string[]
  controllerName?: string
  dependentValues?: Record<string, string[]>
}

export interface ServiceType {
  serviceType: string
  caseType: string
  description: string
  recordTypeID: string
  department: string
  questions: QuestionField[]
}

export interface Issue {
  id: string
  caseNumber?: string
  status: string
  serviceType?: string
  agency?: string
  subject?: string
  description?: string
  address?: string
  zipCode?: string
  latitude?: number
  longitude?: number
  mediaUrl?: string
  createdAt?: string
  updatedAt?: string
}
