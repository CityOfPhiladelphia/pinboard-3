/** Shared types for OEM Flood Finder */
import type { PinboardTypes } from '@pinboard/ui'

export type AlertBanner = {
  title: string
  body: string
}

export type EverbridgeNotification = {
  notificationId: string
  createdOn: Date
  title: string
  body: string
  fileAttachments?: string
}

export type FloodImpact = {
  stage: number
  statement: string
}

export type Flood = {
  floodId: string
  gaugeId: string
  crestReadingId: string
  crest: number
  startDate: Date
  endDate: Date
  crestTime: Date
}

type DeviceType = 'Aware' | 'Usgs' | 'Camera'

export type LocationPanelDTO = {
  id: string
  name: string
  lastUpdated: Date
  gaugeHeight: number
  gaugeHeightUnit: string
  thumbnailUrl: string
  cameraStreamUrl: string
  deviceType: DeviceType
  actionStage: number
  minorStage: number
  moderateStage: number
  majorStage: number
} & PinboardTypes.LatLon

export type OemFields = {
  deviceType: DeviceType
  lastUpdated: Date | null
  actionStage: number
  minorStage: number
  moderateStage: number
  majorStage: number
  cameraStreamUrl: string
}

export type OemLocation = PinboardTypes.BasicLocation & OemFields

export type AwareReadingDTO = {
  validTimeUTC: Date
  gaugeId: string
  flashFloodIndicator: boolean
  flashFloodThreshold: number
  flashFloodDetectionImagingEnabled: boolean
  gaugeHeight: number
  gaugeHeightUnit: string
  isFlooding: boolean
  rainfall: number
  rainIntensity: number
  barometricPressure: number
  airTemperature: number
  waterTemperature: number
  floodImpacts: FloodImpact[]
  floodEvents: Flood[]
}

export type UsgsReadingDTO = {
  validTimeUTC: Date
  gaugeId: string
  isFlooding: boolean
  gaugeHeight: number
  gaugeHeightUnit: string
  floodImpacts: FloodImpact[]
  floodEvents: Flood[]
}

export type Filters = 'all' | 'gauges' | 'cameras'

export type SortMode = 'AlphaAsc' | 'AlphaDes' | 'DistAsc' | 'DistDes' | ''
