import type {
  AgeGroupField,
  AgeGroupFilter,
  SpecialtyField,
  SpecialtyFilter,
  TestsField,
  TestsFilter,
  VisitTypeField,
  VisitTypeFilter,
  WaitTimeFilter,
} from '@/types'

export const filterKeys = {
  ageGroup: 'ageGroup',
  waitTime: 'waitTime',
  visitType: 'visitType',
  specialty: 'specialty',
  tests: 'tests',
  languages: 'languages',
}

export const ageGroupOptions: Record<AgeGroupField, AgeGroupFilter> = {
  adults: 'adult',
  children: 'children',
}

export const waitOptions = ['sameDay', 'weekSick', 'weekWell', 'twoMonths'] as const

export const visitTypeOptions: Record<VisitTypeField, VisitTypeFilter> = {
  primary_well: 'primaryWell',
  primary_sick: 'primarySick',
  primary_sports: 'primarySports',
  primary_prenatal: 'primaryPrenatal',
  primary_women: 'primaryWomen',
  primary_telehealth: 'primaryTelehealth',
  primary_vacc: 'primaryVaccines',
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

export const languageOptions = [
  'asl',
  'amharic',
  'arabic',
  'bengali',
  'burmese',
  'cambodian',
  'cantonese',
  'chinese',
  'english',
  'fanta',
  'filipino',
  'french',
  'frenchcreole',
  'fula',
  'gujarati',
  'haitiancreole',
  'hebrew',
  'hindi',
  'indonesian',
  'karen',
  'khmer',
  'kinyarwanda',
  'kirundi',
  'koloqua',
  'korean',
  'lebanese',
  'malayalam',
  'malaysian',
  'mandarin',
  'nepali',
  'portuguese',
  'punjabi',
  'shanghainese',
  'sinhalese',
  'spanish',
  'swahili',
  'tagalog',
  'taiwanese',
  'telugu',
  'urdu',
  'vietnamese',
  'yoruba',
] as const
