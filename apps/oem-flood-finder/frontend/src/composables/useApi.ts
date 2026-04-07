import type { EverbridgeNotification, LocationDTO } from '@/types'
import { toValue } from 'vue'

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

type LocationsResult = { kind: 'Success', locationDto: LocationDTO } | { kind: 'Error' }

export async function fetchLocations(): Promise<LocationsResult> {

  const response = await fetch(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/location/all`, requestInit);


  if (!response.ok) {
    return { kind: 'Error' };
  }

  return { kind: 'Success', locationDto: await response.json() };
}
