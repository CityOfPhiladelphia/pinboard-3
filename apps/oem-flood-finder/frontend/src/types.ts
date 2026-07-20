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

export interface OemLocation extends PinboardTypes.BasicLocation {
  deviceType: DeviceType
  lastUpdated: Date
  gaugeHeight: number | null
  gaugeHeightUnit: 'in' | null
  actionStage: number | null
  minorStage: number | null
  moderateStage: number | null
  majorStage: number | null
  pictureTimestampUTC: Date | null
  thumbnailUrl: string
  cameraStreamUrl: string | null
}

export interface UsgsReadingDTO {
  validTimeUTC: string
  gaugeId: string
  isFlooding: boolean
  gaugeHeight: number
  gaugeHeightUnit: string
  floodImpacts: FloodImpact[]
  floodEvents: Flood[]
}

export interface AwareReadingDTO extends UsgsReadingDTO {
  flashFloodIndicator: boolean
  flashFloodThreshold: number
  flashFloodDetectionImagingEnabled: boolean
  rainfall: number
  rainIntensity: number
  barometricPressure: number
  airTemperature: number
  waterTemperature: number
}

export type ReadingState =
  | { kind: 'Loading' }
  | { kind: 'Loaded'; gaugeType: 'Aware'; data: AwareReadingDTO[] }
  | { kind: 'Loaded'; gaugeType: 'Usgs'; data: UsgsReadingDTO[] }
  | { kind: 'Error'; message: string }
  | { kind: 'No Call Needed' }

export type Filters = 'all' | 'gauges' | 'cameras'
