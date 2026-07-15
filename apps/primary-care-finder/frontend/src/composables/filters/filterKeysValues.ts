import type {
  AgeRangeField,
  AgeRangeFilterKey,
  FilterKey,
  SpecialtyField,
  SpecialtyFilterKey,
  TestsField,
  TestsFilterKey,
  VisitTypeField,
  VisitTypeFilterKey,
  WaitTimeFilterKey,
} from '@/types'

export const filterKeys: Record<FilterKey, FilterKey> = {
  ageRange: 'ageRange',
  waitTime: 'waitTime',
  visitType: 'visitType',
  specialty: 'specialty',
  tests: 'tests',
  languages: 'languages',
}

export const ageRangeOptions: Record<AgeRangeField, AgeRangeFilterKey> = {
  adults: 'adult',
  children: 'children',
}

export const waitOptions: WaitTimeFilterKey[] = [
  'walkIn',
  'oneWeekSick',
  'oneWeekWell',
  'twoMonths',
]

export const visitTypeOptions: Record<VisitTypeField, VisitTypeFilterKey> = {
  primary_well: 'well',
  primary_sick: 'sick',
  primary_sports: 'sports',
  primary_prenatal: 'prenatal',
  primary_women: 'women',
  primary_telehealth: 'telehealth',
  primary_vacc: 'vaccine',
}

export const specialtyOptions: Record<SpecialtyField, SpecialtyFilterKey> = {
  special_mental: 'mental',
  special_dental: 'dental',
  special_eye: 'eye',
  special_podiatry: 'podiatry',
  special_mat: 'mat',
  special_nutrition: 'nutrition',
  special_tobacco: 'tobacco',
  special_pharmacy: 'pharmacy',
}

export const testsOptions: Record<TestsField, TestsFilterKey> = {
  tests_blood: 'blood',
  tests_sti: 'sti',
  tests_covid: 'covid',
  tests_mammo: 'mammo',
  tests_xray: 'xray',
}
