/** Shared types for OEM Flood Finder */
import type { PinboardTypes } from '@pinboard/ui'

export interface AlertBanner {
  title: string
  body: string
}

export interface EverbridgeNotification {
  notificationId: string
  createdOn: Date
  title: string
  body: string
  fileAttachments?: string
}

export interface FloodImpact {
  stage: number
  statement: string
}

export interface Flood {
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
} & PinboardTypes.BasicLocation

export interface OemFields {
  deviceType: DeviceType
  lastUpdated: Date | null
  actionStage: number
  minorStage: number
  moderateStage: number
  majorStage: number
  cameraStreamUrl: string
}

export type OemLocation = PinboardTypes.BasicLocation & OemFields

export interface AwareReadingDTO {
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

export interface UsgsReadingDTO {
  validTimeUTC: Date
  gaugeId: string
  isFlooding: boolean
  gaugeHeight: number
  gaugeHeightUnit: string
  floodImpacts: FloodImpact[]
  floodEvents: Flood[]
}

export type Filters = 'all' | 'gauges' | 'cameras'

export type SortMode = 'AlphaAsc' | 'DistAsc' | ''
