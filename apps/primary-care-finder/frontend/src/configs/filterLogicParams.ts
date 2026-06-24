import type {
  AgeGroupFilter,
  LanguagesFilter,
  SpecialtyFilter,
  TestsFilter,
  VisitTypeFilter,
  WaitTimeFilter,
} from '@/types'
import { filterDefinitions } from './filterChipDefinitions'
import type { IFilterChoiceBitfieldGroup } from '@pinboard/ui'

const matchYes = ['Yes']
const matchYesEstPat = ['Yes', 'Established Patients']

function matchFieldsToOptions(
  item: Record<string, unknown>,
  fieldNames: string[],
  valuesToMatch: unknown[]
) {
  return fieldNames.some((fieldName) => valuesToMatch.includes(item[fieldName]))
}

function matchOptionInString(
  item: Record<string, unknown>,
  fieldNames: string[],
  valuesToMatch: unknown[]
) {
  return fieldNames.some((fieldName) =>
    valuesToMatch.some((value) =>
      String(item[fieldName]).toLowerCase().trim().includes(String(value).toLowerCase().trim())
    )
  )
}

const ageGroupOption0 = filterDefinitions.value[1].choices?.[0].value ?? 'adult'
const ageGroupOption1 = filterDefinitions.value[1].choices?.[1].value ?? 'children'

const ageGroupFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
  operation: '|',
  choices: {
    [ageGroupOption0]: {
      dataFields: ['adults'],
      matches: matchYes,
      matchingFunction: matchFieldsToOptions,
    },
    [ageGroupOption1]: {
      dataFields: ['children'],
      matches: matchYes,
      matchingFunction: matchFieldsToOptions,
    },
  },
}

const waitOption0 = filterDefinitions.value[2].choices?.[0].value ?? 'sameDay'
const waitOption1 = filterDefinitions.value[2].choices?.[1].value ?? 'weekWell'
const waitOption2 = filterDefinitions.value[2].choices?.[2].value ?? 'weekSick'
const waitOption3 = filterDefinitions.value[2].choices?.[3].value ?? 'twoMonths'

const waitTimeFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
  operation: '|',
  choices: {
    [waitOption0]: {
      dataFields: ['wait_sameday_sick_ad', 'wait_sameday_sick_ch'],
      matches: matchYes,
      matchingFunction: matchFieldsToOptions,
    },
    [waitOption1]: {
      dataFields: ['wait_week_well_ad', 'wait_week_well_ch'],
      matches: matchYes,
      matchingFunction: matchFieldsToOptions,
    },
    [waitOption2]: {
      dataFields: ['wait_week_sick_ad', 'wait_week_sick_ch'],
      matches: matchYes,
      matchingFunction: matchFieldsToOptions,
    },
    [waitOption3]: {
      dataFields: ['wait_2mo_ad', 'wait_2mo_ch'],
      matches: matchYes,
      matchingFunction: matchFieldsToOptions,
    },
  },
}

const visitTypeOption0 = filterDefinitions.value[3].choices?.[0].value ?? 'primaryWell'
const visitTypeOption1 = filterDefinitions.value[3].choices?.[1].value ?? 'primarySick'
const visitTypeOption2 = filterDefinitions.value[3].choices?.[2].value ?? 'primarySports'
const visitTypeOption3 = filterDefinitions.value[3].choices?.[3].value ?? 'primaryPrenatal'
const visitTypeOption4 = filterDefinitions.value[3].choices?.[4].value ?? 'primaryWomen'
const visitTypeOption5 = filterDefinitions.value[3].choices?.[5].value ?? 'primaryTelehealth'
const visitTypeOption6 = filterDefinitions.value[3].choices?.[6].value ?? 'primaryVaccines'

const visitTypeFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
  operation: '|',
  choices: {
    [visitTypeOption0]: {
      dataFields: ['primary_well_ad', 'primary_well_ch'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [visitTypeOption1]: {
      dataFields: ['primary_sick_ad', 'primary_sick_ch'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [visitTypeOption2]: {
      dataFields: ['primary_sports'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [visitTypeOption3]: {
      dataFields: ['primary_prenatal'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [visitTypeOption4]: {
      dataFields: ['primary_women'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [visitTypeOption5]: {
      dataFields: ['primary_telehealth'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [visitTypeOption6]: {
      dataFields: ['primary_vacc_ad', 'primary_vacc_child'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
  },
}

const specialtyOption0 = filterDefinitions.value[4].choices?.[0].value ?? 'mental'
const specialtyOption1 = filterDefinitions.value[4].choices?.[1].value ?? 'dental'
const specialtyOption2 = filterDefinitions.value[4].choices?.[2].value ?? 'eye'
const specialtyOption3 = filterDefinitions.value[4].choices?.[3].value ?? 'podiatry'
const specialtyOption4 = filterDefinitions.value[4].choices?.[4].value ?? 'mat'
const specialtyOption5 = filterDefinitions.value[4].choices?.[5].value ?? 'nutrition'
const specialtyOption6 = filterDefinitions.value[4].choices?.[6].value ?? 'tobacco'
const specialtyOption7 = filterDefinitions.value[4].choices?.[7].value ?? 'pharmacy'

const specialtyFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
  operation: '|',
  choices: {
    [specialtyOption0]: {
      dataFields: ['special_mental_ad', 'special_mental_ch'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [specialtyOption1]: {
      dataFields: ['special_dental_ad', 'special_dental_ch'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [specialtyOption2]: {
      dataFields: ['special_eye_ad', 'special_eye_ch'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [specialtyOption3]: {
      dataFields: ['special_podiatry'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [specialtyOption4]: {
      dataFields: ['special_mat'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [specialtyOption5]: {
      dataFields: ['special_nutrition'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [specialtyOption6]: {
      dataFields: ['special_tobacco'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [specialtyOption7]: {
      dataFields: ['special_pharmacy'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
  },
}

const testsOption0 = filterDefinitions.value[5].choices?.[0].value ?? 'blood'
const testsOption1 = filterDefinitions.value[5].choices?.[1].value ?? 'sti'
const testsOption2 = filterDefinitions.value[5].choices?.[2].value ?? 'covid'
const testsOption3 = filterDefinitions.value[5].choices?.[3].value ?? 'mammo'
const testsOption4 = filterDefinitions.value[5].choices?.[4].value ?? 'xray'

const testsFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
  operation: '|',
  choices: {
    [testsOption0]: {
      dataFields: ['tests_blood'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [testsOption1]: {
      dataFields: ['tests_sti'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [testsOption2]: {
      dataFields: ['tests_covid'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [testsOption3]: {
      dataFields: ['tests_mammo'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [testsOption4]: {
      dataFields: ['tests_xray'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
  },
}

const languageOption0 = filterDefinitions.value[6].choices?.[0].value ?? 'spanish'
const languageOption1 = filterDefinitions.value[6].choices?.[1].value ?? 'mandarin'
const languageOption2 = filterDefinitions.value[6].choices?.[2].value ?? 'vietnamese'

const languageFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
  operation: '|',
  choices: {
    [languageOption0]: {
      dataFields: ['language'],
      matches: ['Spanish'],
      matchingFunction: matchOptionInString,
    },
    [languageOption1]: {
      dataFields: ['language'],
      matches: ['Mandarin'],
      matchingFunction: matchOptionInString,
    },
    [languageOption2]: {
      dataFields: ['language'],
      matches: ['Vietnamese'],
      matchingFunction: matchOptionInString,
    },
  },
}

const optionNames = {
  adult: ageGroupOption0 as AgeGroupFilter,
  children: ageGroupOption1 as AgeGroupFilter,
  sameDay: waitOption0 as WaitTimeFilter,
  weekWell: waitOption1 as WaitTimeFilter,
  weekSick: waitOption2 as WaitTimeFilter,
  twoMonths: waitOption3 as WaitTimeFilter,
  primaryWell: visitTypeOption0 as VisitTypeFilter,
  primarySick: visitTypeOption1 as VisitTypeFilter,
  primarySports: visitTypeOption2 as VisitTypeFilter,
  primaryPrenatal: visitTypeOption3 as VisitTypeFilter,
  primaryWomen: visitTypeOption4 as VisitTypeFilter,
  primaryTelehealth: visitTypeOption5 as VisitTypeFilter,
  primaryVaccines: visitTypeOption6 as VisitTypeFilter,
  mental: specialtyOption0 as SpecialtyFilter,
  dental: specialtyOption1 as SpecialtyFilter,
  eye: specialtyOption2 as SpecialtyFilter,
  podiatry: specialtyOption3 as SpecialtyFilter,
  mat: specialtyOption4 as SpecialtyFilter,
  nutrition: specialtyOption5 as SpecialtyFilter,
  tobacco: specialtyOption6 as SpecialtyFilter,
  pharmacy: specialtyOption7 as SpecialtyFilter,
  blood: testsOption0 as TestsFilter,
  sti: testsOption1 as TestsFilter,
  covid: testsOption2 as TestsFilter,
  mammo: testsOption3 as TestsFilter,
  xray: testsOption4 as TestsFilter,
  spanish: languageOption0 as LanguagesFilter,
  mandarin: languageOption1 as LanguagesFilter,
  vietnamese: languageOption2 as LanguagesFilter,
}

export {
  ageGroupFilterParams,
  waitTimeFilterParams,
  visitTypeFilterParams,
  specialtyFilterParams,
  testsFilterParams,
  languageFilterParams,
  optionNames,
}
