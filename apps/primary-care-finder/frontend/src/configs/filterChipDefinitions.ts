import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FilterDefinition } from '@pinboard/ui'
import { IconSort } from '@phila/phila-ui-core/icons'
const { t } = useI18n()

export const filterDefinitions = computed<FilterDefinition[]>(() => [
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
    key: 'ageGroup',
    label: t('filters.ageGroup'),
    multiple: true,
    choices: [
      { text: t('filters.adult'), value: 'adult' },
      { text: t('filters.children'), value: 'children' },
    ],
  },
  {
    key: 'waitTime',
    label: t('filters.waitTime'),
    multiple: true,
    choices: [
      { text: t('filters.sameDay'), value: 'sameDay' },
      { text: t('filters.weekWell'), value: 'weekWell' },
      { text: t('filters.weekSick'), value: 'weekSick' },
      { text: t('filters.twoMonths'), value: 'twoMonths' },
    ],
  },
  {
    key: 'specialty',
    label: t('filters.specialty'),
    multiple: true,
    choices: [
      { text: t('filters.mental'), value: 'mental' },
      { text: t('filters.dental'), value: 'dental' },
      { text: t('filters.eye'), value: 'eye' },
      { text: t('filters.podiatry'), value: 'podiatry' },
      { text: t('filters.mat'), value: 'mat' },
      { text: t('filters.nutrition'), value: 'nutrition' },
      { text: t('filters.tobacco'), value: 'tobacco' },
      { text: t('filters.pharmacy'), value: 'pharmacy' },
    ],
  },
  {
    key: 'tests',
    label: t('filters.tests'),
    multiple: true,
    choices: [
      { text: t('filters.blood'), value: 'blood' },
      { text: t('filters.sti'), value: 'sti' },
      { text: t('filters.covid'), value: 'covid' },
      { text: t('filters.mammo'), value: 'mammo' },
      { text: t('filters.xray'), value: 'xray' },
    ],
  },
  {
    key: 'languages',
    label: t('filters.languages'),
    multiple: true,
    // TODO(teammate): replace with real `language` field values.
    choices: [
      { text: t('filters.spanish'), value: 'spanish' },
      { text: t('filters.mandarin'), value: 'mandarin' },
      { text: t('filters.vietnamese'), value: 'vietnamese' },
    ],
  },
])
