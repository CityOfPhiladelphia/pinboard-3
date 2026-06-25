import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FilterDefinition } from '@pinboard/ui'
import { IconSort } from '@phila/phila-ui-core/icons'
import { filterKeys, filterValues } from './filterKeysValues'

export function useFilterChipDefinitions() {
  const { t } = useI18n()
  const filterChipDefinitions = computed<FilterDefinition[]>(() => [
    {
      key: 'sort',
      label: t('filters.sort'),
      multiple: false,
      excludeFromCount: true,
      icon: IconSort,
      // TODO(teammate): finalize sort options + ordering logic.
      choices: [
        { text: t('filters.distance'), value: 'distance' },
        { text: t('filters.name'), value: 'name' },
      ],
    },
    {
      key: filterKeys.ageGroup,
      label: t('filters.ageGroup'),
      multiple: true,
      choices: [
        { text: t('filters.adult'), value: filterValues.ageGroupOption0 },
        { text: t('filters.children'), value: filterValues.ageGroupOption1 },
      ],
    },
    {
      key: filterKeys.waitTime,
      label: t('filters.waitTime'),
      multiple: true,
      choices: [
        { text: t('filters.sameDay'), value: filterValues.waitOption0 },
        { text: t('filters.weekWell'), value: filterValues.waitOption1 },
        { text: t('filters.weekSick'), value: filterValues.waitOption2 },
        { text: t('filters.twoMonths'), value: filterValues.waitOption3 },
      ],
    },
    {
      key: filterKeys.visitType,
      label: 'Primary care',
      multiple: true,
      choices: [
        { text: 'Well visit', value: filterValues.visitTypeOption0 },
        { text: 'Sick visit', value: filterValues.visitTypeOption1 },
        { text: 'Sports physicals', value: filterValues.visitTypeOption2 },
        { text: 'Prenatal care', value: filterValues.visitTypeOption3 },
        { text: "Women's health", value: filterValues.visitTypeOption4 },
        { text: 'Telehealth', value: filterValues.visitTypeOption5 },
        { text: 'Vaccines', value: filterValues.visitTypeOption6 },
      ],
    },
    {
      key: filterKeys.specialty,
      label: t('filters.specialty'),
      multiple: true,
      choices: [
        { text: t('filters.mental'), value: filterValues.specialtyOption0 },
        { text: t('filters.dental'), value: filterValues.specialtyOption1 },
        { text: t('filters.eye'), value: filterValues.specialtyOption2 },
        { text: t('filters.podiatry'), value: filterValues.specialtyOption3 },
        { text: t('filters.mat'), value: filterValues.specialtyOption4 },
        { text: t('filters.nutrition'), value: filterValues.specialtyOption5 },
        { text: t('filters.tobacco'), value: filterValues.specialtyOption6 },
        { text: t('filters.pharmacy'), value: filterValues.specialtyOption7 },
      ],
    },
    {
      key: filterKeys.tests,
      label: t('filters.tests'),
      multiple: true,
      choices: [
        { text: t('filters.blood'), value: filterValues.testsOption0 },
        { text: t('filters.sti'), value: filterValues.testsOption1 },
        { text: t('filters.covid'), value: filterValues.testsOption2 },
        { text: t('filters.mammo'), value: filterValues.testsOption3 },
        { text: t('filters.xray'), value: filterValues.testsOption4 },
      ],
    },
    {
      key: filterKeys.languages,
      label: t('filters.languages'),
      multiple: true,
      // TODO(teammate): replace with real `language` field values.
      choices: [
        { text: t('filters.spanish'), value: filterValues.languageOption0 },
        { text: t('filters.mandarin'), value: filterValues.languageOption1 },
        { text: t('filters.vietnamese'), value: filterValues.languageOption2 },
      ],
    },
  ])

  return { filterChipDefinitions }
}
