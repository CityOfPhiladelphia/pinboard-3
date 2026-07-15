import type {
  FilterChoiceBitfield,
  FilterChoiceBitfieldGroup,
  FilterGroup,
  FilterValues,
  PinboardTypes,
} from '@pinboard/ui'
import * as en from './i18n/en'

type YesOrNo = 'Yes' | 'No'
type YesOrNoOrEstablishedPatients = YesOrNo | 'Established Patients'
type WaitTime = 'Same day' | 'Less than one week' | 'Less than two months' | 'More than two months'

export interface PrimaryCareProperties {
  cartodb_id: number
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

  cost_insurance: YesOrNo | null
  cost_medicaid: YesOrNo | null
  cost_sliding_scale: YesOrNo | null
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
  evening_hrs: YesOrNo | null
  later_hours_day: 'M' | 'T' | 'W' | 'R' | 'F' | null
  weekend_hrs: YesOrNo | null
  temporary_closure: string | null

  adults: YesOrNo | null
  children: YesOrNo | null
  caveat_ad_ch: string | null

  primary_prenatal: YesOrNoOrEstablishedPatients | null
  primary_sick: YesOrNoOrEstablishedPatients | null
  primary_telehealth: YesOrNoOrEstablishedPatients | null
  primary_vacc: YesOrNoOrEstablishedPatients | null
  primary_well: YesOrNoOrEstablishedPatients | null
  primary_women: YesOrNoOrEstablishedPatients | null
  primary_sports: YesOrNoOrEstablishedPatients | null

  special_dental: YesOrNoOrEstablishedPatients | null
  special_eye: YesOrNoOrEstablishedPatients | null
  special_mat: YesOrNoOrEstablishedPatients | null
  special_mental: YesOrNoOrEstablishedPatients | null
  special_nutrition: YesOrNoOrEstablishedPatients | null
  special_pharmacy: YesOrNoOrEstablishedPatients | null
  special_podiatry: YesOrNoOrEstablishedPatients | null
  special_tobacco: YesOrNoOrEstablishedPatients | null

  tests_blood: YesOrNo | null
  tests_covid: YesOrNo | null
  tests_mammo: YesOrNo | null
  tests_sti: YesOrNo | null
  tests_xray: YesOrNo | null

  walk_ins_sick: YesOrNo | null
  sick_adult_wait: WaitTime | null
  sick_child_wait: WaitTime | null
  well_adult_wait: WaitTime | null
  well_child_wait: WaitTime | null
  other_services_adult_wait: WaitTime | null
  other_services_child_wait: WaitTime | null

  languages: string | null
}

export type PrimaryCareField = keyof PrimaryCareProperties

export interface PrimaryCareFeature extends PinboardTypes.GeoJsonFeature {
  properties: PrimaryCareProperties
}

export interface PrimaryCareResponse extends PinboardTypes.GeoJSONFeatureCollectionResponse {
  features: PrimaryCareFeature[]
}

export type PrimaryCareLocation = PinboardTypes.BasicLocation & Omit<PrimaryCareFeature, 'type'>

export type SortMode = '' | 'distance' | 'name'

export type FilterKey = 'ageRange' | 'waitTime' | 'visitType' | 'specialty' | 'tests' | 'languages'

export type AgeRangeField = Extract<keyof PrimaryCareProperties, 'adults' | 'children'>

export type AgeRangeFilterKey = Extract<keyof typeof en.default.ageRange, 'adult' | 'children'>

export type WaitTimeField = Extract<
  keyof PrimaryCareProperties,
  | 'walk_ins_sick'
  | 'sick_adult_wait'
  | 'sick_child_wait'
  | 'well_adult_wait'
  | 'well_child_wait'
  | 'other_services_adult_wait'
  | 'other_services_child_wait'
>
export type WaitTimeFilterKey = Exclude<keyof typeof en.default.waitTime, 'category'>

export type VisitTypeField = Extract<
  keyof PrimaryCareProperties,
  | 'primary_well'
  | 'primary_sick'
  | 'primary_sports'
  | 'primary_prenatal'
  | 'primary_women'
  | 'primary_telehealth'
  | 'primary_vacc'
>
export type VisitTypeFilterKey = Exclude<keyof typeof en.default.visitType, 'category'>

export type SpecialtyField = Extract<
  keyof PrimaryCareProperties,
  | 'special_mental'
  | 'special_dental'
  | 'special_eye'
  | 'special_podiatry'
  | 'special_mat'
  | 'special_nutrition'
  | 'special_tobacco'
  | 'special_pharmacy'
>
export type SpecialtyFilter = Exclude<keyof typeof en.default.specialty, 'category'>

export type TestsField = Extract<
  keyof PrimaryCareProperties,
  'tests_blood' | 'tests_sti' | 'tests_covid' | 'tests_mammo' | 'tests_xray'
>
export type TestsFilterKey = Exclude<keyof typeof en.default.tests, 'category' | 'noTests'>

export type LanguagesFilterKey = string

export type PrimaryCareFilterKey =
  | AgeRangeFilterKey
  | WaitTimeFilterKey
  | VisitTypeFilterKey
  | SpecialtyFilter
  | TestsFilterKey
  | LanguagesFilterKey

export interface PrimaryCareFilters extends FilterValues {
  sort: {
    distance: boolean
    name: boolean
  }
  ageRange: Record<AgeRangeFilterKey, boolean>
  visitType: Record<VisitTypeFilterKey | SpecialtyFilter | TestsFilterKey, boolean>
  waitTime: Record<WaitTimeFilterKey, boolean>
  languages: Record<LanguagesFilterKey, boolean>
}

export interface AgeRangeFilterKeyLogic extends FilterChoiceBitfieldGroup {
  childFilters: Record<AgeRangeFilterKey, FilterChoiceBitfield>
}

export interface LanguagesFilterKeyLogic extends FilterChoiceBitfieldGroup {
  childFilters: Record<LanguagesFilterKey, FilterChoiceBitfield>
}

export interface SpecialtyFilterLogic extends FilterChoiceBitfieldGroup {
  childFilters: Record<SpecialtyFilter, FilterChoiceBitfield>
}

export interface TestsFilterKeyLogic extends FilterChoiceBitfieldGroup {
  childFilters: Record<TestsFilterKey, FilterChoiceBitfield>
}

export interface VisitTypeFilterKeyLogic extends FilterChoiceBitfieldGroup {
  childFilters: Record<VisitTypeFilterKey, FilterChoiceBitfield>
}

export interface WaitTimeFilterKeyLogic extends FilterChoiceBitfieldGroup {
  childFilters: Record<WaitTimeFilterKey, FilterChoiceBitfield>
}

type PricareFilterChild = Record<
  FilterKey,
  | AgeRangeFilterKeyLogic
  | LanguagesFilterKeyLogic
  | SpecialtyFilterLogic
  | TestsFilterKeyLogic
  | VisitTypeFilterKeyLogic
  | WaitTimeFilterKeyLogic
>

export interface PrimaryCareFilterLogic extends FilterGroup {
  childFilters: {
    ageRange: AgeRangeFilterKeyLogic
    languages: LanguagesFilterKeyLogic
    specialty: SpecialtyFilterLogic
    tests: TestsFilterKeyLogic
    visitType: VisitTypeFilterKeyLogic
    waitTime: WaitTimeFilterKeyLogic
  }
}
