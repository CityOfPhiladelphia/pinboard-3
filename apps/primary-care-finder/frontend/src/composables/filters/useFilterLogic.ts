import { computed, ref, watchEffect, type Ref } from 'vue'
import {
  filterKeys,
  ageGroupOptions,
  waitOptions,
  visitTypeOptions,
  specialtyOptions,
  testsOptions,
  languageOptions,
} from './filterKeysValues'
import {
  FilterChoiceBitfieldGroup,
  FilterGroup,
  type IFilterChoiceBitfieldGroup,
} from '@pinboard/ui'
import type {
  PrimaryCareField,
  PrimaryCareFilterValues,
  PrimaryCareLocation,
  PrimaryCareProperties,
} from '@/types'

export function useFilterLogic(
  locations: Ref<PrimaryCareLocation[]>,
  filterState: Ref<PrimaryCareFilterValues>
) {
  const filterLogicalValue = ref<Uint32Array>(new Uint32Array())
  const matchYes = ['Yes']
  const matchYesEstPat = ['Yes', 'Established Patients']

  function matchFieldsToOptions(
    item: PrimaryCareLocation,
    fieldNames: (keyof PrimaryCareProperties)[],
    valuesToMatch: unknown[]
  ) {
    return fieldNames.some((fieldName) => valuesToMatch.includes(item.properties[fieldName]))
  }

  function matchOptionInString(
    item: PrimaryCareLocation,
    fieldNames: (keyof PrimaryCareProperties)[],
    valuesToMatch: string[]
  ) {
    return fieldNames.some((fieldName) =>
      valuesToMatch.some((value) =>
        String(item.properties[fieldName])
          .toLowerCase()
          .trim()
          .includes(String(value).toLowerCase().trim())
      )
    )
  }

  const ageGroupFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
    operation: '&',
    choices: {
      [ageGroupOptions.ageGroupOption0]: {
        dataFields: ['adults'],
        matches: matchYes,
        matchingFunction: matchFieldsToOptions,
      },
      [ageGroupOptions.ageGroupOption1]: {
        dataFields: ['children'],
        matches: matchYes,
        matchingFunction: matchFieldsToOptions,
      },
    },
  }

  const visitTypeChoices = {
    [visitTypeOptions.visitTypeOption0]: {
      dataFields: ['primary_well'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [visitTypeOptions.visitTypeOption1]: {
      dataFields: ['primary_sick'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [visitTypeOptions.visitTypeOption2]: {
      dataFields: ['primary_sports'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [visitTypeOptions.visitTypeOption3]: {
      dataFields: ['primary_prenatal'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [visitTypeOptions.visitTypeOption4]: {
      dataFields: ['primary_women'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [visitTypeOptions.visitTypeOption5]: {
      dataFields: ['primary_telehealth'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [visitTypeOptions.visitTypeOption6]: {
      dataFields: ['primary_vacc'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
  }

  const specialtyChoices = {
    [specialtyOptions.specialtyOption0]: {
      dataFields: ['special_mental'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [specialtyOptions.specialtyOption1]: {
      dataFields: ['special_dental'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [specialtyOptions.specialtyOption2]: {
      dataFields: ['special_eye'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [specialtyOptions.specialtyOption3]: {
      dataFields: ['special_podiatry'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [specialtyOptions.specialtyOption4]: {
      dataFields: ['special_mat'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [specialtyOptions.specialtyOption5]: {
      dataFields: ['special_nutrition'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [specialtyOptions.specialtyOption6]: {
      dataFields: ['special_tobacco'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [specialtyOptions.specialtyOption7]: {
      dataFields: ['special_pharmacy'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
  }

  const testsChoices = {
    [testsOptions.testsOption0]: {
      dataFields: ['tests_blood'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [testsOptions.testsOption1]: {
      dataFields: ['tests_sti'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [testsOptions.testsOption2]: {
      dataFields: ['tests_covid'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [testsOptions.testsOption3]: {
      dataFields: ['tests_mammo'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
    [testsOptions.testsOption4]: {
      dataFields: ['tests_xray'],
      matches: matchYesEstPat,
      matchingFunction: matchFieldsToOptions,
    },
  }

  const visitTypeFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
    operation: '&',
    choices: {
      ...visitTypeChoices,
      ...specialtyChoices,
      ...testsChoices,
    },
  }

  const waitTimeFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
    operation: '&',
    choices: {
      [waitOptions.waitOption0]: {
        dataFields: ['walk_ins_sick', 'sick_adult_wait', 'sick_child_wait'],
        matches: ['Yes', 'Same day'],
        matchingFunction: matchFieldsToOptions,
      },
      [waitOptions.waitOption1]: {
        dataFields: ['well_adult_wait', 'well_child_wait'],
        matches: ['Same day', 'Less than one week'],
        matchingFunction: matchFieldsToOptions,
      },
      [waitOptions.waitOption2]: {
        dataFields: ['walk_ins_sick', 'sick_adult_wait', 'sick_child_wait'],
        matches: ['Yes', 'Same day', 'Less than one week'],
        matchingFunction: matchFieldsToOptions,
      },
      [waitOptions.waitOption3]: {
        dataFields: [
          'walk_ins_sick',
          'sick_adult_wait',
          'sick_child_wait',
          'well_adult_wait',
          'well_child_wait',
          'other_services_adult_wait',
          'other_services_child_wait',
        ],
        matches: ['Yes', 'Same day', 'Less than one week', 'Less than two months'],
        matchingFunction: matchFieldsToOptions,
      },
    },
  }

  const languageFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
    operation: '&',
    choices: {
      [languageOptions.languageOption0]: {
        dataFields: ['languages'],
        matches: ['ASL'],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption1]: {
        dataFields: ['languages'],
        matches: ['Amharic'],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption2]: {
        dataFields: ['languages'],
        matches: ['Arabic'],
        matchingFunction: matchOptionInString,
      },
    },
  }

  const filterLogic = computed(() => {
    const commonParams = {
      data: locations.value as Record<string, any>[],
      bufferLength: Math.ceil(locations.value.length / 32),
    }
    const ageGroupFilter = new FilterChoiceBitfieldGroup({
      ...commonParams,
      ...ageGroupFilterParams,
    })
    const waitTimeFilter = new FilterChoiceBitfieldGroup({
      ...commonParams,
      ...waitTimeFilterParams,
    })

    const visitTypeFilter = new FilterChoiceBitfieldGroup({
      ...commonParams,
      ...visitTypeFilterParams,
    })

    const languageFilter = new FilterChoiceBitfieldGroup({
      ...commonParams,
      ...languageFilterParams,
    })

    const filterLogicGroup = new FilterGroup({
      operation: '&',
      bufferLength: commonParams.bufferLength,
      childFilters: {
        [filterKeys.ageGroup]: ageGroupFilter,
        [filterKeys.waitTime]: waitTimeFilter,
        [filterKeys.visitType]: visitTypeFilter,
        [filterKeys.languages]: languageFilter,
      },
    })
    return filterLogicGroup
  })

  watchEffect(() => {
    // age group
    filterLogic.value.childFilters[filterKeys.ageGroup].childFilters[
      ageGroupOptions.ageGroupOption0
    ].setChecked(filterState.value.ageGroup.includes(ageGroupOptions.ageGroupOption0))
    filterLogic.value.childFilters[filterKeys.ageGroup].childFilters[
      ageGroupOptions.ageGroupOption1
    ].setChecked(filterState.value.ageGroup.includes(ageGroupOptions.ageGroupOption1))

    // wait time
    filterLogic.value.childFilters[filterKeys.waitTime].childFilters[
      waitOptions.waitOption0
    ].setChecked(filterState.value.waitTime.includes(waitOptions.waitOption0))
    filterLogic.value.childFilters[filterKeys.waitTime].childFilters[
      waitOptions.waitOption1
    ].setChecked(filterState.value.waitTime.includes(waitOptions.waitOption1))
    filterLogic.value.childFilters[filterKeys.waitTime].childFilters[
      waitOptions.waitOption2
    ].setChecked(filterState.value.waitTime.includes(waitOptions.waitOption2))
    filterLogic.value.childFilters[filterKeys.waitTime].childFilters[
      waitOptions.waitOption3
    ].setChecked(filterState.value.waitTime.includes(waitOptions.waitOption3))

    // visit type
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      visitTypeOptions.visitTypeOption0
    ].setChecked(filterState.value.visitType.includes(visitTypeOptions.visitTypeOption0))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      visitTypeOptions.visitTypeOption1
    ].setChecked(filterState.value.visitType.includes(visitTypeOptions.visitTypeOption1))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      visitTypeOptions.visitTypeOption2
    ].setChecked(filterState.value.visitType.includes(visitTypeOptions.visitTypeOption2))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      visitTypeOptions.visitTypeOption3
    ].setChecked(filterState.value.visitType.includes(visitTypeOptions.visitTypeOption3))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      visitTypeOptions.visitTypeOption4
    ].setChecked(filterState.value.visitType.includes(visitTypeOptions.visitTypeOption4))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      visitTypeOptions.visitTypeOption5
    ].setChecked(filterState.value.visitType.includes(visitTypeOptions.visitTypeOption5))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      visitTypeOptions.visitTypeOption6
    ].setChecked(filterState.value.visitType.includes(visitTypeOptions.visitTypeOption6))

    // specialty
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      specialtyOptions.specialtyOption0
    ].setChecked(filterState.value.specialty.includes(specialtyOptions.specialtyOption0))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      specialtyOptions.specialtyOption1
    ].setChecked(filterState.value.specialty.includes(specialtyOptions.specialtyOption1))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      specialtyOptions.specialtyOption2
    ].setChecked(filterState.value.specialty.includes(specialtyOptions.specialtyOption2))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      specialtyOptions.specialtyOption3
    ].setChecked(filterState.value.specialty.includes(specialtyOptions.specialtyOption3))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      specialtyOptions.specialtyOption4
    ].setChecked(filterState.value.specialty.includes(specialtyOptions.specialtyOption4))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      specialtyOptions.specialtyOption5
    ].setChecked(filterState.value.specialty.includes(specialtyOptions.specialtyOption5))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      specialtyOptions.specialtyOption6
    ].setChecked(filterState.value.specialty.includes(specialtyOptions.specialtyOption6))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      specialtyOptions.specialtyOption7
    ].setChecked(filterState.value.specialty.includes(specialtyOptions.specialtyOption7))

    // tests
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      testsOptions.testsOption0
    ].setChecked(filterState.value.tests.includes(testsOptions.testsOption0))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      testsOptions.testsOption1
    ].setChecked(filterState.value.tests.includes(testsOptions.testsOption1))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      testsOptions.testsOption2
    ].setChecked(filterState.value.tests.includes(testsOptions.testsOption2))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      testsOptions.testsOption3
    ].setChecked(filterState.value.tests.includes(testsOptions.testsOption3))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      testsOptions.testsOption4
    ].setChecked(filterState.value.tests.includes(testsOptions.testsOption4))

    // languages
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption0
    ].setChecked(filterState.value.languages.includes(languageOptions.languageOption0))
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption1
    ].setChecked(filterState.value.languages.includes(languageOptions.languageOption1))
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption2
    ].setChecked(filterState.value.languages.includes(languageOptions.languageOption2))

    filterLogicalValue.value = filterLogic.value.getBitfield()
  })

  return { filterLogicalValue }
}
