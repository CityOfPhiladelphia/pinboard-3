import { ref, toValue, watchEffect, type MaybeRefOrGetter, type Ref } from 'vue'
import type { OemApiResponse, ReadingState } from '@/types'
import { isAwareReadingDTO, isUsgsReadingDTO } from '@/utilities/_index'

export function useLocationDetail(
  gaugeId: MaybeRefOrGetter<string>,
  deviceType: MaybeRefOrGetter<'Aware' | 'Usgs' | 'Camera'>,
): Ref<ReadingState> {
  const readingState = ref<ReadingState>({ kind: 'Loading' })

  watchEffect(async (onCleanup) => {
    const abortController = new AbortController()

    onCleanup(() => abortController.abort())

    if (toValue(deviceType) === 'Camera') {
      readingState.value = { kind: 'No Call Needed' }
      return
    }

    readingState.value = { kind: 'Loading' }
    const data: OemApiResponse | undefined = import.meta.env.DEV
      ? await getGaugeReadingsDev(gaugeId, deviceType, abortController)
      : await getGaugeReadingsProxy(gaugeId, deviceType, abortController)

    switch (true) {
      case isAwareReadingDTO(data): {
        readingState.value = { kind: 'Loaded', gaugeType: 'Aware', data: data }
        return
      }
      case isUsgsReadingDTO(data): {
        readingState.value = { kind: 'Loaded', gaugeType: 'Usgs', data: data }
        return
      }
      default: {
        readingState.value = { kind: 'Error', message: 'Readings API response error' }
        return
      }
    }
  })

  return readingState
}

async function getGaugeReadingsProxy(
  id: MaybeRefOrGetter<string>,
  deviceType: MaybeRefOrGetter<'Aware' | 'Usgs' | 'Camera'>,
  abortController: AbortController,
): Promise<OemApiResponse | undefined> {
  const params = new URLSearchParams({
    kind: toValue(deviceType).toLowerCase(),
    gaugeId: toValue(id),
  })
  const response = await fetch(
    `https://haydr3k097.execute-api.us-east-1.amazonaws.com/getOemReadings?${params.toString()}`,
    {
      signal: abortController.signal,
    },
  )
  if (!response.ok) return
  const data = (await response.json()) as OemApiResponse
  if (!data.length) return
  return data
}

async function getGaugeReadingsDev(
  id: MaybeRefOrGetter<string>,
  deviceType: MaybeRefOrGetter<'Aware' | 'Usgs' | 'Camera'>,
  abortController: AbortController,
) {
  const myHeaders = new Headers()
  myHeaders.append('x-api-key', import.meta.env.VITE_FLOOD_API_KEY || '')
  const response = await fetch(
    `${import.meta.env.VITE_FLOOD_API_BASE_URL}/${toValue(deviceType).toLowerCase()}/reading/${toValue(id)}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      signal: abortController.signal,
    },
  )

  if (!response.ok) return
  const data = (await response.json()) as OemApiResponse
  if (!data.length) return
  return data
}
