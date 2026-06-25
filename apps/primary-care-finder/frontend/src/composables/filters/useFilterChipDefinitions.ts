import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FilterDefinition } from '@pinboard/ui'
import { IconSort } from '@phila/phila-ui-core/icons'
import {
  filterKeys,
  ageGroupOptions,
  waitOptions,
  visitTypeOptions,
  specialtyOptions,
  testsOptions,
  languageOptions,
} from './filterKeysValues'

export function useFilterChipDefinitions() {
  const { t } = useI18n()
  // const filterChipDefinitions = computed<FilterDefinition[]>(() => [
  //   {
  //     key: 'sort',
  //     label: t('filters.sort'),
  //     multiple: false,
  //     excludeFromCount: true,
  //     icon: IconSort,
  //     choices: [
  //       { text: t('filters.distance'), value: 'distance' },
  //       { text: t('filters.name'), value: 'name' },
  //     ],
  //   },
  //   {
  //     key: filterKeys.ageGroup,
  //     label: t('filters.ageGroup'),
  //     multiple: true,
  //     choices: [
  //       { text: t('filters.adult'), value: filterValues.ageGroupOption0 },
  //       { text: t('filters.children'), value: filterValues.ageGroupOption1 },
  //     ],
  //   },
  //   {
  //     key: filterKeys.waitTime,
  //     label: t('filters.waitTime'),
  //     multiple: true,
  //     choices: [
  //       { text: t('filters.sameDay'), value: filterValues.waitOption0 },
  //       { text: t('filters.weekSick'), value: filterValues.waitOption1 },
  //       { text: t('filters.weekWell'), value: filterValues.waitOption2 },
  //       { text: t('filters.twoMonths'), value: filterValues.waitOption3 },
  //     ],
  //   },
  //   {
  //     key: filterKeys.visitType,
  //     label: 'Primary care',
  //     multiple: true,
  //     choices: [
  //       { text: 'Well visit', value: filterValues.visitTypeOption0 },
  //       { text: 'Sick visit', value: filterValues.visitTypeOption1 },
  //       { text: 'Sports physicals', value: filterValues.visitTypeOption2 },
  //       { text: 'Prenatal care', value: filterValues.visitTypeOption3 },
  //       { text: "Women's health", value: filterValues.visitTypeOption4 },
  //       { text: 'Telehealth', value: filterValues.visitTypeOption5 },
  //       { text: 'Vaccines', value: filterValues.visitTypeOption6 },
  //     ],
  //   },
  //   {
  //     key: filterKeys.specialty,
  //     label: t('filters.specialty'),
  //     multiple: true,
  //     choices: [
  //       { text: t('filters.mental'), value: filterValues.specialtyOption0 },
  //       { text: t('filters.dental'), value: filterValues.specialtyOption1 },
  //       { text: t('filters.eye'), value: filterValues.specialtyOption2 },
  //       { text: t('filters.podiatry'), value: filterValues.specialtyOption3 },
  //       { text: t('filters.mat'), value: filterValues.specialtyOption4 },
  //       { text: t('filters.nutrition'), value: filterValues.specialtyOption5 },
  //       { text: t('filters.tobacco'), value: filterValues.specialtyOption6 },
  //       { text: t('filters.pharmacy'), value: filterValues.specialtyOption7 },
  //     ],
  //   },
  //   {
  //     key: filterKeys.tests,
  //     label: t('filters.tests'),
  //     multiple: true,
  //     choices: [
  //       { text: t('filters.blood'), value: filterValues.testsOption0 },
  //       { text: t('filters.sti'), value: filterValues.testsOption1 },
  //       { text: t('filters.covid'), value: filterValues.testsOption2 },
  //       { text: t('filters.mammo'), value: filterValues.testsOption3 },
  //       { text: t('filters.xray'), value: filterValues.testsOption4 },
  //     ],
  //   },
  //   {
  //     key: filterKeys.languages,
  //     label: t('filters.languages'),
  //     multiple: true,
  //     // TODO(teammate): replace with real `language` field values.
  //     choices: [
  //       { text: t('filters.spanish'), value: filterValues.languageOption0 },
  //       { text: t('filters.mandarin'), value: filterValues.languageOption1 },
  //       { text: t('filters.vietnamese'), value: filterValues.languageOption2 },
  //     ],
  //   },
  // ])

  const filterChipDefinitions = computed<FilterDefinition[]>(() => [
    {
      key: 'sort',
      label: t('filters.sort'),
      multiple: false,
      excludeFromCount: true,
      icon: IconSort,
      choices: [
        { text: t('filters.distance'), value: 'distance' },
        { text: t('filters.name'), value: 'name' },
      ],
    },
    {
      key: filterKeys.ageGroup,
      label: t('ageRange.category'),
      multiple: true,
      choices: [
        { text: t('ageRange.adult'), value: ageGroupOptions.ageGroupOption0 },
        { text: t('ageRange.child'), value: ageGroupOptions.ageGroupOption1 },
      ],
    },
    {
      key: filterKeys.visitType,
      label: t('visitType.category'),
      multiple: true,
      choices: [
        { text: t('visitType.well'), value: visitTypeOptions.visitTypeOption0 },
        { text: t('visitType.sick'), value: visitTypeOptions.visitTypeOption1 },
        { text: t('visitType.sports'), value: visitTypeOptions.visitTypeOption2 },
        { text: t('visitType.prenatal'), value: visitTypeOptions.visitTypeOption3 },
        { text: t('visitType.women'), value: visitTypeOptions.visitTypeOption4 },
        { text: t('visitType.telehealth'), value: visitTypeOptions.visitTypeOption5 },
        { text: t('visitType.vaccine'), value: visitTypeOptions.visitTypeOption6 },
        { text: t('specialty.mental'), value: specialtyOptions.specialtyOption0 },
        { text: t('specialty.dental'), value: specialtyOptions.specialtyOption1 },
        { text: t('specialty.eye'), value: specialtyOptions.specialtyOption2 },
        { text: t('specialty.podiatry'), value: specialtyOptions.specialtyOption3 },
        { text: t('filters.mat'), value: specialtyOptions.specialtyOption4 },
        { text: t('filters.nutrition'), value: specialtyOptions.specialtyOption5 },
        { text: t('filters.tobacco'), value: specialtyOptions.specialtyOption6 },
        { text: t('filters.pharmacy'), value: specialtyOptions.specialtyOption7 },
        { text: t('filters.blood'), value: testsOptions.testsOption0 },
        { text: t('filters.sti'), value: testsOptions.testsOption1 },
        { text: t('filters.covid'), value: testsOptions.testsOption2 },
        { text: t('tests.mammo'), value: testsOptions.testsOption3 },
        { text: t('tests.xray'), value: testsOptions.testsOption4 },
      ],
    },
    {
      key: filterKeys.waitTime,
      label: t('waitTime.category'),
      multiple: true,
      choices: [
        { text: t('waitTime.walkIn'), value: waitOptions.waitOption0 },
        { text: t('waitTime.oneWeekSick'), value: waitOptions.waitOption1 },
        { text: t('waitTime.oneWeekWell'), value: waitOptions.waitOption2 },
        { text: t('waitTime.twoMonths'), value: waitOptions.waitOption3 },
      ],
    },
    {
      key: filterKeys.languages,
      label: t('languages.category'),
      multiple: true,
      choices: [
        { text: t('languages.asl'), value: languageOptions.languageOption0 },
        { text: t('languages.amharic'), value: languageOptions.languageOption1 },
        { text: t('languages.arabic'), value: languageOptions.languageOption2 },
        { text: t('languages.bengali'), value: languageOptions.languageOption3 },
        { text: t('languages.burmese'), value: languageOptions.languageOption4 },
        { text: t('languages.cambodian'), value: languageOptions.languageOption5 },
        { text: t('languages.cantonese'), value: languageOptions.languageOption6 },
        { text: t('languages.chinese'), value: languageOptions.languageOption7 },
        { text: t('languages.english'), value: languageOptions.languageOption8 },
        { text: t('languages.fanta'), value: languageOptions.languageOption9 },
        { text: t('languages.filipino'), value: languageOptions.languageOption10 },
        { text: t('languages.french'), value: languageOptions.languageOption11 },
        { text: t('languages.frenchcreole'), value: languageOptions.languageOption12 },
        { text: t('languages.fula'), value: languageOptions.languageOption13 },
        { text: t('languages.gujarati'), value: languageOptions.languageOption14 },
        { text: t('languages.haitiancreole'), value: languageOptions.languageOption15 },
        { text: t('languages.hebrew'), value: languageOptions.languageOption16 },
        { text: t('languages.hindi'), value: languageOptions.languageOption17 },
        { text: t('languages.indonesian'), value: languageOptions.languageOption18 },
        { text: t('languages.karen'), value: languageOptions.languageOption19 },
        { text: t('languages.khmer'), value: languageOptions.languageOption20 },
        { text: t('languages.kinyarwanda'), value: languageOptions.languageOption21 },
        { text: t('languages.kirundi'), value: languageOptions.languageOption22 },
        { text: t('languages.koloqua'), value: languageOptions.languageOption23 },
        { text: t('languages.korean'), value: languageOptions.languageOption24 },
        { text: t('languages.lebanese'), value: languageOptions.languageOption25 },
        { text: t('languages.malayalam'), value: languageOptions.languageOption26 },
        { text: t('languages.malaysian'), value: languageOptions.languageOption27 },
        { text: t('languages.mandarin'), value: languageOptions.languageOption28 },
        { text: t('languages.nepali'), value: languageOptions.languageOption29 },
        { text: t('languages.portuguese'), value: languageOptions.languageOption30 },
        { text: t('languages.punjabi'), value: languageOptions.languageOption31 },
        { text: t('languages.shanghainese'), value: languageOptions.languageOption32 },
        { text: t('languages.sinhalese'), value: languageOptions.languageOption33 },
        { text: t('languages.spanish'), value: languageOptions.languageOption34 },
        { text: t('languages.swahili'), value: languageOptions.languageOption35 },
        { text: t('languages.tagalog'), value: languageOptions.languageOption36 },
        { text: t('languages.taiwanese'), value: languageOptions.languageOption37 },
        { text: t('languages.telugu'), value: languageOptions.languageOption38 },
        { text: t('languages.urdu'), value: languageOptions.languageOption39 },
        { text: t('languages.vietnamese'), value: languageOptions.languageOption40 },
        { text: t('languages.yoruba'), value: languageOptions.languageOption41 },
      ],
    },
  ])

  return { filterChipDefinitions }
}
