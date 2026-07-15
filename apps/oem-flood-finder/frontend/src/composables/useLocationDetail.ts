import { ref, toValue, watchEffect, type MaybeRefOrGetter, type Ref } from 'vue'
import type { AwareReadingDTO, ReadingState } from '@/types'

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
    const data: AwareReadingDTO[] = import.meta.env.DEV
      ? await getGaugeReadingsDev(gaugeId, deviceType, readingState, abortController)
      : await getGaugeReadingsProxy(gaugeId, deviceType, readingState, abortController)

    readingState.value =
      toValue(deviceType) === 'Aware'
        ? { kind: 'Loaded', gaugeType: 'Aware', data: data }
        : (readingState.value = { kind: 'Loaded', gaugeType: 'Usgs', data: data })
  })

  return readingState
}

async function getGaugeReadingsProxy(
  id: MaybeRefOrGetter<string>,
  deviceType: MaybeRefOrGetter<'Aware' | 'Usgs' | 'Camera'>,
  readingStateRef: Ref,
  abortController: AbortController,
) {
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

  if (!response.ok) {
    readingStateRef.value = { kind: 'Error', message: 'Readings API response error' }
    return
  }

  return await response.json()
}

async function getGaugeReadingsDev(
  id: MaybeRefOrGetter<string>,
  deviceType: MaybeRefOrGetter<'Aware' | 'Usgs' | 'Camera'>,
  readingStateRef: Ref,
  abortController: AbortController,
) {
  const myHeaders = new Headers()
  myHeaders.append('x-api-key', import.meta.env.VITE_FLOOD_API_KEY || '')
  console.log(toValue(id))
  const response = await fetch(
    `${import.meta.env.VITE_FLOOD_API_BASE_URL}/${toValue(deviceType).toLowerCase()}/reading/${toValue(id)}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      signal: abortController.signal,
    },
  )

  if (!response.ok) {
    readingStateRef.value = { kind: 'Error', message: 'Readings API response error' }
    return
  }

  return await response.json()
}
