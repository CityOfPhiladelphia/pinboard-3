import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FilterDefinition } from '@pinboard/ui'
import { IconSort } from '@phila/phila-ui-core/icons'
import {
  filterKeys,
  ageRangeOptions,
  waitOptions,
  visitTypeOptions,
  specialtyOptions,
  testsOptions,
} from './filterKeysValues'

export function useFilterChipDefinitions(languages: Ref<string[]>) {
  const { t } = useI18n()
  const filterChipDefinitions = computed<FilterDefinition[]>(() => {
    const chipDefinitions: FilterDefinition[] = [
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
        key: filterKeys.ageRange,
        label: t('ageRange.category'),
        multiple: true,
        choices: [
          { text: t('ageRange.adult'), value: ageRangeOptions.adults },
          { text: t('ageRange.child'), value: ageRangeOptions.children },
        ],
      },
      {
        key: filterKeys.visitType,
        label: t('visitType.category'),
        multiple: true,
        choices: [
          {
            text: t('visitType.well'),
            value: visitTypeOptions.primary_well,
            tooltip: t('tooltips.well'),
          },
          { text: t('visitType.sick'), value: visitTypeOptions.primary_sick },
          { text: t('visitType.sports'), value: visitTypeOptions.primary_sports },
          { text: t('visitType.prenatal'), value: visitTypeOptions.primary_prenatal },
          {
            text: t('visitType.women'),
            value: visitTypeOptions.primary_women,
            tooltip: t('tooltips.women'),
          },
          { text: t('visitType.telehealth'), value: visitTypeOptions.primary_telehealth },
          { text: t('visitType.vaccine'), value: visitTypeOptions.primary_vacc },
          { text: t('specialty.mental'), value: specialtyOptions.special_mental },
          { text: t('specialty.dental'), value: specialtyOptions.special_dental },
          { text: t('specialty.eye'), value: specialtyOptions.special_eye },
          { text: t('specialty.podiatry'), value: specialtyOptions.special_podiatry },
          {
            text: t('specialty.mat'),
            value: specialtyOptions.special_mat,
            tooltip: t('tooltips.mat'),
          },
          { text: t('specialty.nutrition'), value: specialtyOptions.special_nutrition },
          { text: t('specialty.tobacco'), value: specialtyOptions.special_tobacco },
          { text: t('specialty.pharmacy'), value: specialtyOptions.special_pharmacy },
          { text: t('tests.blood'), value: testsOptions.tests_blood },
          { text: t('tests.sti'), value: testsOptions.tests_sti },
          { text: t('tests.covid'), value: testsOptions.tests_covid },
          { text: t('tests.mammo'), value: testsOptions.tests_mammo },
          { text: t('tests.xray'), value: testsOptions.tests_xray },
        ],
      },
      {
        key: filterKeys.waitTime,
        label: t('waitTime.category'),
        multiple: true,
        choices: [
          { text: t('waitTime.walkIn'), value: waitOptions[0] },
          { text: t('waitTime.oneWeekSick'), value: waitOptions[1] },
          { text: t('waitTime.oneWeekWell'), value: waitOptions[2] },
          { text: t('waitTime.twoMonths'), value: waitOptions[3] },
        ],
      },
    ]
    if (languages.value.length) {
      chipDefinitions.push({
        key: filterKeys.languages,
        label: t('languages.category'),
        multiple: true,
        choices: Array.from(languages.value, (lang) => {
          return { text: t(`languages.${lang}`), value: lang }
        }),
      })
    }
    return chipDefinitions
  })

  return { filterChipDefinitions }
}
