/** Shared types for OEM Flood Finder */

export type Location = {
  id: string,
  name: string,
  latitude: number,
  longitude: number,
  type: Gauge | Reading | Camera
}

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

export type Camera = {
  cameraId: string,
  name: string,
  latitude: number,
  longitude: number,
  lastUpdated: Date,
  createdOn: Date,
  locationDescription?: string,
  pageUrl: string
}
