/** Shared types for OEM Flood Finder */
import type { BasicLocation } from '@ui/types'
import { type SortLocationsOptions } from '../../../../packages/ui/src/types'

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

export type LocationListDTO = {
  id: string
  name: string
  latitude: number
  longitude: number
  lastUpdated: Date
  gaugeHeight: number
  gaugeHeightUnit: string
  imageUrl: string
  deviceType: DeviceType
  actionStage: number
  minorStage: number
  moderateStage: number
  majorStage: number
}

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

export const sortLocationsOptions: SortLocationsOptions = {
  None: 'Sort',
  AlphaAsc: 'Alpha-Asc',
  AlphaDes: 'Alpha-Des',
  DistAsc: 'Dist-Asc',
  DistDes: 'Dist-Des',
} as const
