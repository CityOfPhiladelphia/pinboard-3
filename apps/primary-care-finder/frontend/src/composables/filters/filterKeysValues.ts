import type {
  AgeGroupFilter,
  LanguagesFilter,
  SpecialtyFilter,
  TestsFilter,
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

export const ageGroupOptions: Record<string, AgeGroupFilter> = {
  ageGroupOption0: 'adult',
  ageGroupOption1: 'children',
}

export const waitOptions: Record<string, WaitTimeFilter> = {
  waitOption0: 'sameDay',
  waitOption1: 'weekSick',
  waitOption2: 'weekWell',
  waitOption3: 'twoMonths',
}

export const visitTypeOptions: Record<string, VisitTypeFilter> = {
  visitTypeOption0: 'primaryWell',
  visitTypeOption1: 'primarySick',
  visitTypeOption2: 'primarySports',
  visitTypeOption3: 'primaryPrenatal',
  visitTypeOption4: 'primaryWomen',
  visitTypeOption5: 'primaryTelehealth',
  visitTypeOption6: 'primaryVaccines',
}

export const specialtyOptions: Record<string, SpecialtyFilter> = {
  specialtyOption0: 'mental',
  specialtyOption1: 'dental',
  specialtyOption2: 'eye',
  specialtyOption3: 'podiatry',
  specialtyOption4: 'mat',
  specialtyOption5: 'nutrition',
  specialtyOption6: 'tobacco',
  specialtyOption7: 'pharmacy',
}

export const testsOptions: Record<string, TestsFilter> = {
  testsOption0: 'blood',
  testsOption1: 'sti',
  testsOption2: 'covid',
  testsOption3: 'mammo',
  testsOption4: 'xray',
}

export const languageOptions: Record<string, LanguagesFilter> = {
  languageOption0: 'asl',
  languageOption1: 'amharic',
  languageOption2: 'arabic',
  languageOption3: 'bengali',
  languageOption4: 'burmese',
  languageOption5: 'cambodian',
  languageOption6: 'cantonese',
  languageOption7: 'chinese',
  languageOption9: 'fanta',
  languageOption10: 'filipino',
  languageOption11: 'french',
  languageOption12: 'frenchcreole',
  languageOption13: 'fula',
  languageOption14: 'gujarati',
  languageOption15: 'haitiancreole',
  languageOption16: 'hebrew',
  languageOption17: 'hindi',
  languageOption18: 'indonesian',
  languageOption19: 'karen',
  languageOption20: 'khmer',
  languageOption21: 'kinyarwanda',
  languageOption22: 'kirundi',
  languageOption23: 'koloqua',
  languageOption24: 'korean',
  languageOption25: 'lebanese',
  languageOption26: 'malayalam',
  languageOption27: 'malaysian',
  languageOption28: 'mandarin',
  languageOption29: 'nepali',
  languageOption30: 'portuguese',
  languageOption31: 'punjabi',
  languageOption32: 'shanghainese',
  languageOption33: 'sinhalese',
  languageOption34: 'spanish',
  languageOption35: 'swahili',
  languageOption36: 'tagalog',
  languageOption37: 'taiwanese',
  languageOption38: 'telugu',
  languageOption39: 'urdu',
  languageOption40: 'vietnamese',
  languageOption41: 'yoruba',
}
