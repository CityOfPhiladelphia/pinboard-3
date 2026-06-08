// ABOUTME: Format a meter distance as feet (under 0.1 mile) or miles otherwise.
// ABOUTME: Returns null for missing/NaN inputs so the caller can skip the row.

const METERS_PER_MILE = 1609.344
const METERS_PER_FOOT = 0.3048

export function formatDistance(meters: number | undefined | null): string | null {
  if (meters == null || Number.isNaN(meters)) return null
  const miles = meters / METERS_PER_MILE
  if (miles < 0.1) {
    const feet = Math.round(meters / METERS_PER_FOOT)
    return `${feet} ft`
  }
  return `${miles.toFixed(1)} mi`
}
