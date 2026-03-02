/** Shared types for OEM Flood Finder */

export interface Location {
  name: string
  address: string
}

export type ApiResponse = Location[]

// TODO: fill in fields from the location detail API response
export interface LocationDetail {
  name: string
  address: string
}
