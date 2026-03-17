/** Shared types for OEM Flood Finder */

export type FloodImpact = {
  stage: number,
  statement: string
}

export type LocationDTO = {
  awareGauges: AwareGauge[],
  usgsGauges: UsgsGauge[],
  cameras: Camera[]
}

export type Location = {
  id: string,
  name: string,
  latitude: number,
  longitude: number,
  lastUpdated: Date | null,
  other:
    { kind: 'Aware', data: AwareGauge } |
    { kind: 'Usgs', data: UsgsGauge } |
    { kind: 'Camera', data: Camera }
}

export type UsgsGauge = {
  gaugeId: string,
  name: string,
  latitude: number,
  longitude: number,
  lastUpdated: Date | null,
  actionStage: number,
  minorStage: number,
  moderateStage: number,
  majorStage: number,
  hydrographURL: string,
  hydrographWithFloodCategoriesURL: string,
  stageUnits: string,
  floodImpacts: FloodImpact[]
}

export type AwareGauge = {
  gaugeId: string,
  name: string,
  latitude: number,
  longitude: number,
  lastUpdated: Date | null,
  modemNumber: string,
  pictureFilenameOnServer: string,
  actionStage: number,
  minorStage: number,
  moderateStage: number,
  stageUnits: string,
  floodImpacts: FloodImpact[]
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
