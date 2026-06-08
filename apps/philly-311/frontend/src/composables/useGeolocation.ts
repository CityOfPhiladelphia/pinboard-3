// ABOUTME: Browser geolocation wrapper with a sane timeout. Resolves to null
// ABOUTME: on denial, error, or unavailable APIs (no exceptions).

const TIMEOUT_MS = 10_000

export function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: TIMEOUT_MS, maximumAge: 60_000, enableHighAccuracy: false },
    )
  })
}
