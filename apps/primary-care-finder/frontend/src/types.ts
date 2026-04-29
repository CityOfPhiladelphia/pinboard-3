import type { PinboardTypes } from '@pinboard/ui'

export interface PrimaryCareLocationInfo {
  properties: PrimaryCareProperties
  geometry: { type: string; coordinates: [number, number, ...number[]] }
}

export type PrimaryCareLocation = PinboardTypes.BasicLocation &
  PrimaryCareLocationInfo

export interface PrimaryCareProperties {
  objectid: number
  record: string
  address: string
  address_2: string | null
  zip_code: string
  med_phone_num: string | null
  website: string | null
  language: string | null
  sliding_scale: string | null
  optional_info_general: string | null
  data_complete: string | null

  // Primary care services
  primary_well_ad: string | null
  primary_well_ch: string | null
  primary_sick_ad: string | null
  primary_sick_ch: string | null
  primary_vacc_ad: string | null
  primary_vacc_child: string | null
  primary_sports: string | null
  primary_prenatal: string | null
  primary_women: string | null
  primary_telehealth: string | null

  // Specialty services
  special_mental_ad: string | null
  special_mental_ch: string | null
  special_dental_ad: string | null
  special_dental_ch: string | null
  special_eye_ad: string | null
  special_eye_ch: string | null
  special_podiatry: string | null
  special_mat: string | null
  special_nutrition: string | null
  special_tobacco: string | null
  special_pharmacy: string | null

  // Wait times
  wait_sameday_sick_ch: string | null
  wait_sameday_sick_ad: string | null
  wait_week_well_ch: string | null
  wait_week_well_ad: string | null
  wait_week_sick_ch: string | null
  wait_week_sick_ad: string | null
  wait_2mo_ch: string | null
  wait_2mo_ad: string | null

  // Tests
  tests_blood: string | null
  tests_sti: string | null
  tests_covid: string | null
  tests_mammo: string | null
  tests_xray: string | null

  // Transit
  transport_bus: string | null
  transport_subway: string | null
  transport_train: string | null
  transport_trolley: string | null
  transport_parking: string | null

  // Hours (mon-sun: start, end, exceptions)
  hours_mon_start: string | null
  hours_mon_end: string | null
  hours_mon_exceptions: string | null
  hours_tues_start: string | null
  hours_tues_end: string | null
  hours_tues_exceptions: string | null
  hours_wed_start: string | null
  hours_wed_end: string | null
  hours_wed_exceptions: string | null
  hours_thurs_start: string | null
  hours_thurs_end: string | null
  hours_thurs_exceptions: string | null
  hours_fri_start: string | null
  hours_fri_end: string | null
  hours_fri_exceptions: string | null
  hours_sat_start: string | null
  hours_sat_end: string | null
  hours_sat_exceptions: string | null
  hours_sun_start: string | null
  hours_sun_end: string | null
  hours_sun_exceptions: string | null

  [key: string]: unknown
}
