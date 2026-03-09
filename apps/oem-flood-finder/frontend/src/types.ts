/** Shared types for OEM Flood Finder */

export type LocationDTO = {
  awareGauges: Gauge[],
  usgsGauges: Gauge[],
  cameras: Camera[]
}

export type Location = {
  id: string,
  name: string,
  latitude: number,
  longitude: number,
  lastUpdated: Date | null,
  other:
    { kind: 'AwareGauge', data: Gauge } |
    { kind: 'UsgsGauge', data: Gauge } |
    { kind: 'Camera', data: Camera }
}

export type Gauge = {
  gaugeId: string,
  name: string,
  latitude: number,
  longitude: number,
  lastUpdated: Date | null,
  actionStage: number,
  minorStage: number,
  moderateStage: number,
  stageUnits: string,
  floodImpacts: object[]
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
