import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FilterProps } from '@pinboard/ui'
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
  const filterChipDefinitions = computed<FilterProps[]>(() => {
    const chipDefinitions: FilterProps[] = [
      {
        name: 'sort',
        label: t('filters.sort'),
        multiple: false,
        excludeFromCount: true,
        icon: IconSort,
        choices: [
          { label: t('filters.distance'), value: 'distance' },
          { label: t('filters.name'), value: 'name' },
        ],
      },
      {
        name: filterKeys.ageRange,
        label: t('ageRange.category'),
        multiple: true,
        choices: [
          { label: t('ageRange.adult'), value: ageRangeOptions.adults },
          { label: t('ageRange.child'), value: ageRangeOptions.children },
        ],
      },
      {
        name: filterKeys.visitType,
        label: t('visitType.category'),
        multiple: true,
        choices: [
          {
            label: t('visitType.well'),
            value: visitTypeOptions.primary_well,
            tooltip: t('tooltips.well'),
          },
          { label: t('visitType.sick'), value: visitTypeOptions.primary_sick },
          { label: t('visitType.sports'), value: visitTypeOptions.primary_sports },
          { label: t('visitType.prenatal'), value: visitTypeOptions.primary_prenatal },
          {
            label: t('visitType.women'),
            value: visitTypeOptions.primary_women,
            tooltip: t('tooltips.women'),
          },
          { label: t('visitType.telehealth'), value: visitTypeOptions.primary_telehealth },
          { label: t('visitType.vaccine'), value: visitTypeOptions.primary_vacc },
          { label: t('specialty.mental'), value: specialtyOptions.special_mental },
          { label: t('specialty.dental'), value: specialtyOptions.special_dental },
          { label: t('specialty.eye'), value: specialtyOptions.special_eye },
          { label: t('specialty.podiatry'), value: specialtyOptions.special_podiatry },
          {
            label: t('specialty.mat'),
            value: specialtyOptions.special_mat,
            tooltip: t('tooltips.mat'),
          },
          { label: t('specialty.nutrition'), value: specialtyOptions.special_nutrition },
          { label: t('specialty.tobacco'), value: specialtyOptions.special_tobacco },
          { label: t('specialty.pharmacy'), value: specialtyOptions.special_pharmacy },
          { label: t('tests.blood'), value: testsOptions.tests_blood },
          { label: t('tests.sti'), value: testsOptions.tests_sti },
          { label: t('tests.covid'), value: testsOptions.tests_covid },
          { label: t('tests.mammo'), value: testsOptions.tests_mammo },
          { label: t('tests.xray'), value: testsOptions.tests_xray },
        ],
      },
      {
        name: filterKeys.waitTime,
        label: t('waitTime.category'),
        multiple: true,
        choices: [
          { label: t('waitTime.walkIn'), value: waitOptions[0] },
          { label: t('waitTime.oneWeekSick'), value: waitOptions[1] },
          { label: t('waitTime.oneWeekWell'), value: waitOptions[2] },
          { label: t('waitTime.twoMonths'), value: waitOptions[3] },
        ],
      },
    ]
    if (languages.value.length) {
      chipDefinitions.push({
        name: filterKeys.languages,
        label: t('languages.category'),
        multiple: true,
        choices: Array.from(languages.value, (lang) => {
          return { label: t(`languages.${lang}`), value: lang }
        }),
      })
    }
    return chipDefinitions
  })

  return { filterChipDefinitions }
}
