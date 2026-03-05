/** Shared types for OEM Flood Finder */

// export interface Location {
//   name: string
//   address: string
// }

// export type ApiResponse = Location[]

// // TODO: fill in fields from the location detail API response
// export interface LocationDetail {
//   name: string
//   address: string
// }

export type Gauge = {
  gaugeId: string,
  name: string,
  latitude: number,
  longitude: number,
  lastUpdated: Date | null
}

export type Reading = {
  
  readingId: string,
  createdOn: Date,
  validTimeUTC: Date,
  gaugeId: string,
  flashFloodIndicator: boolean,
  flashFloodThreshold: number,
  flashFloodDetectionImagingEnabled: boolean,
  gaugeHeight: number,
  gaugeHeightUnit: string,
  isFlooding: boolean,
  depthHoldHours: number,
  depthDetectionImagingEnabled: boolean,
  rainfall: number,
  rainIntensity: number,
  tips: number,
  barometricPressure: number,
  airTemperature: number,
  waterTemperature: number,
  saltWater: boolean,
  dropRateIndicator: boolean,
  dropRateThreshold: number,
  deviceDropCount: number
}
