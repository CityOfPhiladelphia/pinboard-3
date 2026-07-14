import type {
  AgeRangeField,
  AgeRangeFilter,
  FilterKey,
  SpecialtyField,
  SpecialtyFilter,
  TestsField,
  TestsFilter,
  VisitTypeField,
  VisitTypeFilter,
  WaitTimeFilter,
} from '@/types'

export const filterKeys: Record<FilterKey, FilterKey> = {
  ageRange: 'ageRange',
  waitTime: 'waitTime',
  visitType: 'visitType',
  specialty: 'specialty',
  tests: 'tests',
  languages: 'languages',
}

export const ageRangeOptions: Record<AgeRangeField, AgeRangeFilter> = {
  adults: 'adult',
  children: 'children',
}

export const waitOptions: WaitTimeFilter[] = ['walkIn', 'oneWeekSick', 'oneWeekWell', 'twoMonths']

export const visitTypeOptions: Record<VisitTypeField, VisitTypeFilter> = {
  primary_well: 'well',
  primary_sick: 'sick',
  primary_sports: 'sports',
  primary_prenatal: 'prenatal',
  primary_women: 'women',
  primary_telehealth: 'telehealth',
  primary_vacc: 'vaccine',
}

export const specialtyOptions: Record<SpecialtyField, SpecialtyFilter> = {
  special_mental: 'mental',
  special_dental: 'dental',
  special_eye: 'eye',
  special_podiatry: 'podiatry',
  special_mat: 'mat',
  special_nutrition: 'nutrition',
  special_tobacco: 'tobacco',
  special_pharmacy: 'pharmacy',
}

export const testsOptions: Record<TestsField, TestsFilter> = {
  tests_blood: 'blood',
  tests_sti: 'sti',
  tests_covid: 'covid',
  tests_mammo: 'mammo',
  tests_xray: 'xray',
}
