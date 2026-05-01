/** Shared types for OEM Flood Finder */
import type { BasicLocation, LatLon } from '@ui/types'

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

type DeviceType = 'Aware' | 'Usgs' | 'Camera'

export type LocationPanelDTO = {
  id: string
  name: string
  lastUpdated: Date
  gaugeHeight: number
  gaugeHeightUnit: string
  imageUrl: string
  deviceType: DeviceType
  actionStage: number
  minorStage: number
  moderateStage: number
  majorStage: number
} & LatLon

export type OemFields = {
  deviceType: DeviceType
  lastUpdated: Date | null
  actionStage: number
  minorStage: number
  moderateStage: number
  majorStage: number
}

export type OemLocation = BasicLocation & OemFields

export type Reading = {
  readingId: string
  createdOn: Date
  validTimeUTC: Date
  gaugeId: string
  flashFloodIndicator: boolean
  flashFloodThreshold: number
  flashFloodDetectionImagingEnabled: boolean
  gaugeHeight: number
  gaugeHeightUnit: string
  isFlooding: boolean
  depthHoldHours: number
  depthDetectionImagingEnabled: boolean
  rainfall: number
  rainIntensity: number
  tips: number
  barometricPressure: number
  airTemperature: number
  waterTemperature: number
  saltWater: boolean
  dropRateIndicator: boolean
  dropRateThreshold: number
  deviceDropCount: number
  pictureFilenameOnServer: string
}

export type Filters = 'all' | 'gauges' | 'cameras'

export type SortMode = 'AlphaAsc' | 'DistAsc' | ''
