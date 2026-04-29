// packages/ui/src/types.ts
import type { MapCardProps } from '@phila/phila-ui-cards'

export type Latitude = number
export type Longitude = number

export type LocationCoordinate = [Longitude, Latitude]

export type LatLon = {
  latitude: Latitude
  longitude: Longitude
}

export type ZipcodePolygon = {
  centroid: LatLon
  nodes: LocationCoordinate[]
}

export type LocationPermissionState = 'granted' | 'prompt' | 'denied'

export type MapControlPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export interface MapConfig {
  center?: LocationCoordinate
  zoom?: number
  pitch?: number
  bearing?: number
  minZoom?: number
  maxZoom?: number
  basemapChangeControls?: {
    toggle?: boolean
    dropdown?: boolean
    position?: MapControlPosition
  }
  navigationControls?: { position?: MapControlPosition }
  geolocationControl?: { position?: MapControlPosition }
  mapSearchControl?: { position?: MapControlPosition; placeholder?: string }
  ariaLabel?: string
  mobile?: {
    center?: LocationCoordinate
    zoom?: number
  }
}

export interface PinboardConfig {
  title: string
  map?: MapConfig
}

export type AlertBanner = {
  title: string
  message: string
}

export type BasicLocation = {
  id: string
  name: string
  locationCardInfo: MapCardProps
} & LatLon

export type LocationFilterOption = {
  readonly value: string
  readonly label: string
}

export type SearchMode = 'address' | 'zipcode' | 'keyword' | false

export type MenuOption = Readonly<{
  text: string
  value: string
}>

export type SortLocationsOptions = Readonly<{
  [key: string]: string
}>

export type AisAutocompleteResult = Readonly<{
  query: string
  query_type: string
  count: number
  results: Readonly<{
    placenames: string[]
    addresses: Array<
      Readonly<{
        address: string
        search_address: string
        has_opa: boolean
      }>
    >
  }>
}>

export type AisAddressSearchResponse = {
  search_type: string
  search_params: Record<string, string>
  query: string
  normalized: string
  crs: {
    type: string
    properties: {
      type: string
      href: string
    }
  }
  page: number
  page_count: number
  page_size: number
  total_size: number
  type: string
  features: [
    {
      type: string
      ais_feature_type: string
      match_type: string
      properties: {
        street_address: string
        base_address: string
        address_low: number | null
        address_low_suffix: string
        address_low_frac: string
        address_high: number | null
        street_predir: string
        street_name: string
        street_suffix: string
        street_postdir: string
        unit_type: string
        unit_num: string
        floor: string
        street_full: string
        street_code: number | null
        seg_id: number | null
        zip_code: string
        zip_4: string
        usps_bldgfirm: string
        usps_type: string
        election_block_id: string
        election_precinct: string
        pwd_parcel_id: string
        dor_parcel_id: string
        li_address_key: string
        eclipse_location_id: string
        bin: string
        i_parcel_id: string
        zoning_document_ids: Array<string>
        pwd_account_nums: Array<string>
        opa_account_num: string
        opa_owners: Array<string>
        opa_address: string
        center_city_district: string
        cua_zone: string
        li_district: string
        philly_rising_area: string
        census_tract_2010: string
        census_block_group_2010: string
        census_block_2010: string
        census_tract_2020: string
        census_block_group_2020: string
        census_block_2020: string
        council_district_2016: string
        council_district_2024: string
        political_ward: string
        political_division: string
        state_house_rep_2012: string
        state_house_rep_2022: string
        state_senate_2012: string
        state_senate_2022: string
        us_congressional_2012: string
        us_congressional_2018: string
        us_congressional_2022: string
        planning_district: string
        elementary_school: string
        middle_school: string
        high_school: string
        zoning: string
        zoning_rco: string
        commercial_corridor: string
        historic_district: string
        historic_site: string
        police_division: string
        police_district: string
        police_service_area: string
        rubbish_recycle_day: string
        secondary_rubbish_day: string
        recycling_diversion_rate: number | null
        leaf_collection_area: string
        sanitation_area: string
        sanitation_district: string
        sanitation_convenience_center: string
        clean_philly_block_captain: string
        historic_street: string
        highway_district: string
        highway_section: string
        highway_subsection: string
        traffic_district: string
        traffic_pm_district: string
        street_light_route: string
        lane_closure: string
        pwd_maint_district: string
        pwd_pressure_district: string
        pwd_treatment_plant: string
        pwd_water_plate: string
        pwd_center_city_district: string
        major_phila_watershed: string
        neighborhood_advisory_committee: string
        ppr_friends: string
        engine_local: string
        ladder_local: string
        tobacco_retailer_permit_capped: string
        tobacco_free_school_zones: string
        h3_hex_grid_r7: string
        h3_hex_grid_r8: string
        h3_hex_grid_r9: string
        h3_hex_grid_r10: string
      }
      geometry: {
        geocode_type: string
        type: string
        coordinates: LocationCoordinate
      }
    },
  ]
}
