// ABOUTME: Per-service-type color mapping ported from native ServiceType.kt so
// ABOUTME: map markers across web and native share a visual language. Falls back
// ABOUTME: to a neutral gray for unknown types, including any future service
// ABOUTME: types added in Salesforce.

import type { Service } from '@/types/app'

const FALLBACK_COLOR = '#666673'

const COLORS: Record<Service, string> = {
  'Abandoned Vehicle': '#734db3',
  'Abandoned Bike': '#4d8ce6',
  'Illegal Dumping': '#e63333',
  'Rubbish Collection': '#33b359',
  'Recyclables Collection': '#1aa68c',
  'Sanitation Violation': '#d9661a',
  'Dumpster Violation': '#bf4d1a',
  'Pothole Repair': '#99591a',
  'Cave-In Repair': '#b34026',
  Depression: '#8c6626',
  'Ditch Repair': '#735926',
  'Push-Up': '#a6731a',
  'Dangerous Sidewalk': '#d98c0d',
  'ADA Curb Ramp': '#1a80e6',
  'Line Striping': '#e6bf0d',
  'Street Light Outage': '#f2b30d',
  'Alley Light Outage': '#d98c0d',
  'Street Light (Other)': '#e6991a',
  'Street Light(Other)': '#e6991a',
  'Traffic Signal Emergency': '#f22626',
  'Stop Sign Repair': '#d91a33',
  'Property Maintenance Exterior': '#4d66cc',
  'Property Maintenance Interior': '#664dcc',
  'Exterior High Weeds': '#40b333',
  'Building Structurally Dangerous (Occupied)': '#e61a1a',
  'Building Structurally Dangerous (Vacant)': '#bf1a4d',
  'Vacant Lot': '#8c8c99',
  'Vacant Property': '#73738c',
  'Tree Maintenance': '#269933',
  'Street Trees': '#40bf4d',
  'Graffiti Removal': '#a61abf',
  'Dead Animal in Street': '#804d26',
  'Residential Fire Safety Complaint': '#f2400d',
  'Smoke Detector': '#e6660d',
  'Inlet Cleaning': '#1a8ce6',
  'Hydrant Knocked Down': '#e61a26',
  'Manhole Cover Missing': '#4d4d59',
  'Manhole Other Problem': FALLBACK_COLOR,
  'Homeless Encampment': '#8c59b3',
  'Parks and Rec Safety and Maintenance': '#1ab373',
  'Demolition Complaint': '#e6730d',
  'Work Underway without Permits': '#f2590d',
  'Work Underway in violation of permit requirements': '#d9400d',
  Salting: '#1a99d9',
  Shoveling: '#33b3f2',
  'Icy Road Surface': '#26bfe6',
  'Snow Removal': '#40a6f2',
  'Complaint (Streets)': '#737380',
  'Other (Streets)': FALLBACK_COLOR,
  'Vendor Complaint': '#d9a60d',
  'Unlicensed Business Complaint': '#cc8c0d',
  'Short Term Rental Complaint': '#3373cc',
  'Plastic Bag Complaint': '#1aa6a6',
  'Needle Collection': '#bf1a66',
}

export function serviceTypeColor(serviceType?: Service): string {
  return serviceType ? COLORS[serviceType] : FALLBACK_COLOR
}

export function serviceTypeTintStyle(serviceType?: Service): {
  backgroundColor: string
  color: string
} {
  const color = serviceTypeColor(serviceType)
  return { backgroundColor: `color-mix(in srgb, ${color} 15%, white)`, color }
}
