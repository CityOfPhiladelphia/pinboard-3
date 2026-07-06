import type { PinboardTypes } from '@pinboard/ui'

export interface PrimaryCareProperties {
  cartodb_id: number | null
  objectid: number | null
  event_id: number | null
  project_id: number | null
  data_complete: '0' | '1' | '2' | null

  gdb_geomattr_data: string | null

  record: string | null
  record_id: string | null

  address: string | null
  address_2: string | null
  street_address: string | null
  zip_code: string | null

  transport_bus: string | null
  transport_parking: string | null
  transport_subway: string | null
  transport_train: string | null
  transport_trolley: string | null

  website: string | null
  med_phone_num: string | null
  appt_link_method: string | null
  url_appt: string | null
  url_payment: string | null

  cost_insurance: 'Yes' | 'No' | null
  cost_medicaid: 'Yes' | 'No' | null
  cost_sliding_scale: 'Yes' | 'No' | null
  sliding_scale: string | null

  optional_info_general: string | null

  hours_fri_end: string | null
  hours_fri_exceptions: string | null
  hours_fri_start: string | null
  hours_mon_end: string | null
  hours_mon_exceptions: string | null
  hours_mon_start: string | null
  hours_sat_end: string | null
  hours_sat_exceptions: string | null
  hours_sat_start: string | null
  hours_sun_end: string | null
  hours_sun_exceptions: string | null
  hours_sun_start: string | null
  hours_thurs_end: string | null
  hours_thurs_exceptions: string | null
  hours_thurs_start: string | null
  hours_tues_end: string | null
  hours_tues_exceptions: string | null
  hours_tues_start: string | null
  hours_wed_end: string | null
  hours_wed_exceptions: string | null
  hours_wed_start: string | null
  evening_hrs: 'Yes' | 'No' | null
  later_hours_day: 'M' | 'T' | 'W' | 'R' | 'F' | null
  weekend_hrs: 'Yes' | 'No' | null
  temporary_closure: string | null

  adults: 'Yes' | 'No' | null
  children: 'Yes' | 'No' | null
  caveat_ad_ch: string | null

  primary_prenatal: 'Yes' | 'Established Patients' | 'No' | null
  primary_sick: 'Yes' | 'Established Patients' | 'No' | null
  primary_telehealth: 'Yes' | 'Established Patients' | 'No' | null
  primary_vacc: 'Yes' | 'Established Patients' | 'No' | null
  primary_well: 'Yes' | 'Established Patients' | 'No' | null
  primary_women: 'Yes' | 'Established Patients' | 'No' | null
  primary_sports: 'Yes' | 'Established Patients' | 'No' | null

  special_dental: 'Yes' | 'Established Patients' | 'No' | null
  special_eye: 'Yes' | 'Established Patients' | 'No' | null
  special_mat: 'Yes' | 'Established Patients' | 'No' | null
  special_mental: 'Yes' | 'Established Patients' | 'No' | null
  special_nutrition: 'Yes' | 'Established Patients' | 'No' | null
  special_pharmacy: 'Yes' | 'Established Patients' | 'No' | null
  special_podiatry: 'Yes' | 'Established Patients' | 'No' | null
  special_tobacco: 'Yes' | 'Established Patients' | 'No' | null

  tests_blood: 'Yes' | 'No' | null
  tests_covid: 'Yes' | 'No' | null
  tests_mammo: 'Yes' | 'No' | null
  tests_sti: 'Yes' | 'No' | null
  tests_xray: 'Yes' | 'No' | null

  walk_ins_sick: 'Yes' | 'No' | null
  sick_adult_wait:
    | 'Same day'
    | 'Less than one week'
    | 'Less than two months'
    | 'More than two months'
    | null
  sick_child_wait:
    | 'Same day'
    | 'Less than one week'
    | 'Less than two months'
    | 'More than two months'
    | null
  well_adult_wait:
    | 'Same day'
    | 'Less than one week'
    | 'Less than two months'
    | 'More than two months'
    | null
  well_child_wait:
    | 'Same day'
    | 'Less than one week'
    | 'Less than two months'
    | 'More than two months'
    | null
  other_services_adult_wait:
    | 'Same day'
    | 'Less than one week'
    | 'Less than two months'
    | 'More than two months'
    | null
  other_services_child_wait:
    | 'Same day'
    | 'Less than one week'
    | 'Less than two months'
    | 'More than two months'
    | null

  languages: string | null
}

export type PrimaryCareField = keyof PrimaryCareProperties

export interface PrimaryCareFeature extends PinboardTypes.CartoFeature {
  properties: PrimaryCareProperties
}

export interface PrimaryCareResponse extends PinboardTypes.GeoJSONFeatureCollectionResponse {
  features: PrimaryCareFeature[]
}

export type PrimaryCareLocation = PinboardTypes.BasicLocation & Omit<PrimaryCareFeature, 'type'>

export type SortMode = '' | 'distance' | 'name'
export type AgeGroupFilter = 'adult' | 'children'
export type WaitTimeFilter = 'sameDay' | 'weekWell' | 'weekSick' | 'twoMonths'
export type VisitTypeFilter =
  | 'primaryWell'
  | 'primarySick'
  | 'primarySports'
  | 'primaryPrenatal'
  | 'primaryWomen'
  | 'primaryTelehealth'
  | 'primaryVaccines'
export type SpecialtyFilter =
  | 'mental'
  | 'dental'
  | 'eye'
  | 'podiatry'
  | 'mat'
  | 'nutrition'
  | 'tobacco'
  | 'pharmacy'
export type TestsFilter = 'blood' | 'sti' | 'covid' | 'mammo' | 'xray'
export type LanguagesFilter =
  | 'asl'
  | 'amharic'
  | 'arabic'
  | 'bengali'
  | 'burmese'
  | 'cambodian'
  | 'cantonese'
  | 'chinese'
  | 'fanta'
  | 'filipino'
  | 'french'
  | 'frenchcreole'
  | 'fula'
  | 'gujarati'
  | 'haitiancreole'
  | 'hebrew'
  | 'hindi'
  | 'indonesian'
  | 'karen'
  | 'khmer'
  | 'kinyarwanda'
  | 'kirundi'
  | 'koloqua'
  | 'korean'
  | 'lebanese'
  | 'malayalam'
  | 'malaysian'
  | 'mandarin'
  | 'nepali'
  | 'portuguese'
  | 'punjabi'
  | 'shanghainese'
  | 'sinhalese'
  | 'spanish'
  | 'swahili'
  | 'tagalog'
  | 'taiwanese'
  | 'telugu'
  | 'urdu'
  | 'vietnamese'
  | 'yoruba'

export interface PrimaryCareFilters extends Record<string, Record<string, boolean>> {
  sort: {
    distance: boolean
    name: boolean
  }
  ageGroup: {
    adult: boolean
    children: boolean
  }
  visitType: {
    blood: boolean
    covid: boolean
    dental: boolean
    eye: boolean
    mammo: boolean
    mat: boolean
    mental: boolean
    nutrition: boolean
    pharmacy: boolean
    podiatry: boolean
    primaryPrenatal: boolean
    primarySick: boolean
    primarySports: boolean
    primaryTelehealth: boolean
    primaryVaccines: boolean
    primaryWell: boolean
    primaryWomen: boolean
    sti: boolean
    tobacco: boolean
    xray: boolean
  }
  waitTime: {
    sameDay: boolean
    twoMonths: boolean
    weekSick: boolean
    weekWell: boolean
  }
  languages: {
    amharic: boolean
    arabic: boolean
    asl: boolean
    bengali: boolean
    burmese: boolean
    cambodian: boolean
    cantonese: boolean
    chinese: boolean
    fanta: boolean
    filipino: boolean
    french: boolean
    frenchcreole: boolean
    fula: boolean
    gujarati: boolean
    haitiancreole: boolean
    hebrew: boolean
    hindi: boolean
    indonesian: boolean
    karen: boolean
    khmer: boolean
    kinyarwanda: boolean
    kirundi: boolean
    koloqua: boolean
    korean: boolean
    lebanese: boolean
    malayalam: boolean
    malaysian: boolean
    mandarin: boolean
    nepali: boolean
    portuguese: boolean
    punjabi: boolean
    shanghainese: boolean
    sinhalese: boolean
    spanish: boolean
    swahili: boolean
    tagalog: boolean
    taiwanese: boolean
    telugu: boolean
    urdu: boolean
    vietnamese: boolean
    yoruba: boolean
  }
}
