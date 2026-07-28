// ABOUTME: Shared geographic defaults for seeding nearby-report searches when no
// ABOUTME: user location or search center is available.

// Center City Philadelphia (the City Hall area) — used as the fallback map center.
export const DEFAULT_CENTER = { lat: 39.9526, lng: -75.1652 }

// Radius (meters) that covers the whole city from any in-bounds anchor — matches the API's MAX_RADIUS.
export const CITYWIDE_RADIUS = 60000
