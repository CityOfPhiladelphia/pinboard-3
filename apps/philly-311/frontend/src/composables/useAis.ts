// ABOUTME: AIS — Phila's Address Information System. Autocomplete returns
// ABOUTME: matching address strings; search resolves an address (or lat/lng)
// ABOUTME: to a feature with coordinates + street_address + zip_code.
import { buildUrl } from './api311'

export interface AisAutocompleteResult {
  address: string
  searchAddress: string
}

export interface AisFeature {
  streetAddress: string
  zipCode?: string
  lat: number
  lng: number
}

const autocompleteBase = () => import.meta.env.VITE_311_AIS_BASE_URL ?? ''
const searchBase = () => import.meta.env.VITE_311_AIS_BASE_URL ?? ''
const gatekeeperKey = () => import.meta.env.VITE_311_AIS_GATEKEEPER_KEY ?? ''

export async function autocompleteAddresses(
  q: string,
  signal?: AbortSignal,
): Promise<AisAutocompleteResult[]> {
  if (!q.trim()) return []
  const url = buildUrl(autocompleteBase(), '/autocomplete', { q, client_id: gatekeeperKey() })
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`AIS autocomplete failed: ${res.status}`)
  const data = await res.json()
  const addresses = data?.results?.addresses ?? []
  return addresses.map((a: { address: string; search_address: string }) => ({
    address: a.address,
    searchAddress: a.search_address,
  }))
}

async function searchByPath(path: string, signal?: AbortSignal): Promise<AisFeature | null> {
  const url = buildUrl(searchBase(), `/search/${encodeURIComponent(path)}`, {
    client_id: gatekeeperKey(),
  })
  const res = await fetch(url, { signal })
  if (!res.ok) return null
  const data = await res.json()
  const feature = data?.features?.[0]
  if (!feature) return null
  const [lng, lat] = feature.geometry?.coordinates ?? []
  if (typeof lng !== 'number' || typeof lat !== 'number') return null
  return {
    streetAddress: feature.properties?.street_address ?? '',
    zipCode: feature.properties?.zip_code,
    lat,
    lng,
  }
}

export function searchAddress(query: string, signal?: AbortSignal): Promise<AisFeature | null> {
  return searchByPath(query, signal)
}

export function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<AisFeature | null> {
  return searchByPath(`${lng},${lat}`, signal)
}
