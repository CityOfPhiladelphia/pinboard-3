import type { AwareReadingDTO, OemApiResponse, UsgsReadingDTO } from '@/types'

const usgsKeys: string[] = [
  'validTimeUTC',
  'gaugeId',
  'isFlooding',
  'gaugeHeight',
  'gaugeHeightUnit',
  'floodImpacts',
  'floodEvents',
] satisfies (keyof UsgsReadingDTO)[]

const awareKeys: string[] = [
  'flashFloodIndicator',
  'flashFloodThreshold',
  'flashFloodDetectionImagingEnabled',
  'rainfall',
  'rainIntensity',
  'barometricPressure',
  'airTemperature',
  'waterTemperature',
  ...(usgsKeys as (keyof UsgsReadingDTO)[]),
] satisfies (keyof AwareReadingDTO)[]

export function isAwareReadingDTO(data: OemApiResponse | undefined): data is AwareReadingDTO[] {
  if (!Array.isArray(data) || !data.length) return false
  const responseKeys = Object.keys(data[0])
  return responseKeys.every((key) => awareKeys.includes(key))
}

export function isUsgsReadingDTO(data: OemApiResponse | undefined): data is UsgsReadingDTO[] {
  if (!Array.isArray(data) || !data.length) return false
  const responseKeys = Object.keys(data[0])
  return responseKeys.every(
    (key) => usgsKeys.includes(key) && awareKeys.some((key) => !usgsKeys.includes(key)),
  )
}
