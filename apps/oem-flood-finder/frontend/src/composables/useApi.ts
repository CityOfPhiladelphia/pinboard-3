import type { EverbridgeNotification, LocationDTO, Reading } from '@/types'

type Result<T> = { kind: 'Success', data: T } | { kind: 'Error' }

const myHeaders = new Headers()
myHeaders.append('x-api-key', import.meta.env.VITE_FLOOD_API_KEY || '')

const requestInit: RequestInit = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow',
}

export async function fetchAlerts(limit: number): Promise<EverbridgeNotification[]> {
  const response = await fetch(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/everbridge/notifications?limit=${limit}`, requestInit);

  return await response.json()
}

export async function fetchLocations(): Promise<Result<LocationDTO>> {

  const response = await fetch(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/location/all`, requestInit);

  if (!response.ok) {
    return { kind: 'Error' };
  }

  return { kind: 'Success', data: await response.json() };
}

export async function fetchReadings(
  gaugeId: string,
  kind: 'Aware' | 'Usgs' | 'Camera',
  limit: number,
  abortController: AbortController
  ) : Promise<Result<Reading[]>> {

  const response = await fetch(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/${kind.toLowerCase()}/reading/${gaugeId}?limit=${limit}`, {
    ...requestInit,
    signal: abortController.signal
  });

  if (!response.ok) {
    return { kind: 'Error' };
  }

  return { kind: 'Success', data: await response.json() };
}