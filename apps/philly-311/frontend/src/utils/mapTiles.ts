// ABOUTME: Shared raster source spec for map basemaps. The phila-ui-map-core
// ABOUTME: default points at a Phila ArcGIS service that 404s on tiles outside
// ABOUTME: a tightly-cached region; OSM works everywhere and needs no auth.

import type { RasterSourceSpecification } from 'maplibre-gl'

export const OSM_RASTER_SOURCE: RasterSourceSpecification = {
  type: 'raster',
  tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
  tileSize: 256,
  attribution: '© OpenStreetMap contributors',
  maxzoom: 19,
}
