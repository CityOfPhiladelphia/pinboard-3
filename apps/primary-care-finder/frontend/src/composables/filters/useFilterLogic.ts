import { computed, ref, watchEffect, type Ref } from 'vue'
import { filterKeys, filterValues } from './filterKeysValues'
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

  interface FilterParams {
    dataFields: PrimaryCareField[]
  }

  const ageGroupFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
    operation: '|',
    choices: {
      [filterValues.ageGroupOption0]: {
        dataFields: ['adults'],
        matches: matchYes,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.ageGroupOption1]: {
        dataFields: ['children'],
        matches: matchYes,
        matchingFunction: matchFieldsToOptions,
      },
    },
  }

  const visitTypeFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
    operation: '|',
    choices: {
      [filterValues.visitTypeOption0]: {
        dataFields: ['primary_well'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.visitTypeOption1]: {
        dataFields: ['primary_sick'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.visitTypeOption2]: {
        dataFields: ['primary_sports'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.visitTypeOption3]: {
        dataFields: ['primary_prenatal'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.visitTypeOption4]: {
        dataFields: ['primary_women'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.visitTypeOption5]: {
        dataFields: ['primary_telehealth'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.visitTypeOption6]: {
        dataFields: ['primary_vacc'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
    },
  }

  const specialtyFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
    operation: '|',
    choices: {
      [filterValues.specialtyOption0]: {
        dataFields: ['special_mental'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.specialtyOption1]: {
        dataFields: ['special_dental'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.specialtyOption2]: {
        dataFields: ['special_eye'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.specialtyOption3]: {
        dataFields: ['special_podiatry'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.specialtyOption4]: {
        dataFields: ['special_mat'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.specialtyOption5]: {
        dataFields: ['special_nutrition'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.specialtyOption6]: {
        dataFields: ['special_tobacco'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.specialtyOption7]: {
        dataFields: ['special_pharmacy'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
    },
  }

  const testsFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
    operation: '|',
    choices: {
      [filterValues.testsOption0]: {
        dataFields: ['tests_blood'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.testsOption1]: {
        dataFields: ['tests_sti'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.testsOption2]: {
        dataFields: ['tests_covid'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.testsOption3]: {
        dataFields: ['tests_mammo'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.testsOption4]: {
        dataFields: ['tests_xray'],
        matches: matchYesEstPat,
        matchingFunction: matchFieldsToOptions,
      },
    },
  }

  const waitTimeFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
    operation: '|',
    choices: {
      [filterValues.waitOption0]: {
        dataFields: ['walk_ins_sick', 'sick_adult_wait', 'sick_child_wait'],
        matches: ['Yes', 'Same day'],
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.waitOption1]: {
        dataFields: ['well_adult_wait', 'well_child_wait'],
        matches: ['Same day', 'Less than one week'],
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.waitOption2]: {
        dataFields: ['walk_ins_sick', 'sick_adult_wait', 'sick_child_wait'],
        matches: ['Yes', 'Same day', 'Less than one week'],
        matchingFunction: matchFieldsToOptions,
      },
      [filterValues.waitOption3]: {
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
    operation: '|',
    choices: {
      [filterValues.languageOption0]: {
        dataFields: ['languages'],
        matches: ['Spanish'],
        matchingFunction: matchOptionInString,
      },
      [filterValues.languageOption1]: {
        dataFields: ['languages'],
        matches: ['Mandarin'],
        matchingFunction: matchOptionInString,
      },
      [filterValues.languageOption2]: {
        dataFields: ['languages'],
        matches: ['Vietnamese'],
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

    const specialtyFilter = new FilterChoiceBitfieldGroup({
      ...commonParams,
      ...specialtyFilterParams,
    })

    const testsFilter = new FilterChoiceBitfieldGroup({
      ...commonParams,
      ...testsFilterParams,
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
        [filterKeys.specialty]: specialtyFilter,
        [filterKeys.tests]: testsFilter,
        [filterKeys.languages]: languageFilter,
      },
    })
    return filterLogicGroup
  })

  watchEffect(() => {
    // age group
    filterLogic.value.childFilters[filterKeys.ageGroup].childFilters[
      filterValues.ageGroupOption0
    ].setChecked(filterState.value.ageGroup.includes(filterValues.ageGroupOption0))
    filterLogic.value.childFilters[filterKeys.ageGroup].childFilters[
      filterValues.ageGroupOption1
    ].setChecked(filterState.value.ageGroup.includes(filterValues.ageGroupOption1))

    // wait time
    filterLogic.value.childFilters[filterKeys.waitTime].childFilters[
      filterValues.waitOption0
    ].setChecked(filterState.value.waitTime.includes(filterValues.waitOption0))
    filterLogic.value.childFilters[filterKeys.waitTime].childFilters[
      filterValues.waitOption1
    ].setChecked(filterState.value.waitTime.includes(filterValues.waitOption1))
    filterLogic.value.childFilters[filterKeys.waitTime].childFilters[
      filterValues.waitOption2
    ].setChecked(filterState.value.waitTime.includes(filterValues.waitOption2))
    filterLogic.value.childFilters[filterKeys.waitTime].childFilters[
      filterValues.waitOption3
    ].setChecked(filterState.value.waitTime.includes(filterValues.waitOption3))

    // visit type
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      filterValues.visitTypeOption0
    ].setChecked(filterState.value.visitType.includes(filterValues.visitTypeOption0))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      filterValues.visitTypeOption1
    ].setChecked(filterState.value.visitType.includes(filterValues.visitTypeOption1))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      filterValues.visitTypeOption2
    ].setChecked(filterState.value.visitType.includes(filterValues.visitTypeOption2))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      filterValues.visitTypeOption3
    ].setChecked(filterState.value.visitType.includes(filterValues.visitTypeOption3))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      filterValues.visitTypeOption4
    ].setChecked(filterState.value.visitType.includes(filterValues.visitTypeOption4))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      filterValues.visitTypeOption5
    ].setChecked(filterState.value.visitType.includes(filterValues.visitTypeOption5))
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      filterValues.visitTypeOption6
    ].setChecked(filterState.value.visitType.includes(filterValues.visitTypeOption6))

    // specialty
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      filterValues.specialtyOption0
    ].setChecked(filterState.value.specialty.includes(filterValues.specialtyOption0))
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      filterValues.specialtyOption1
    ].setChecked(filterState.value.specialty.includes(filterValues.specialtyOption1))
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      filterValues.specialtyOption2
    ].setChecked(filterState.value.specialty.includes(filterValues.specialtyOption2))
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      filterValues.specialtyOption3
    ].setChecked(filterState.value.specialty.includes(filterValues.specialtyOption3))
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      filterValues.specialtyOption4
    ].setChecked(filterState.value.specialty.includes(filterValues.specialtyOption4))
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      filterValues.specialtyOption5
    ].setChecked(filterState.value.specialty.includes(filterValues.specialtyOption5))
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      filterValues.specialtyOption6
    ].setChecked(filterState.value.specialty.includes(filterValues.specialtyOption6))
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      filterValues.specialtyOption7
    ].setChecked(filterState.value.specialty.includes(filterValues.specialtyOption7))

    // tests
    filterLogic.value.childFilters[filterKeys.tests].childFilters[
      filterValues.testsOption0
    ].setChecked(filterState.value.tests.includes(filterValues.testsOption0))
    filterLogic.value.childFilters[filterKeys.tests].childFilters[
      filterValues.testsOption1
    ].setChecked(filterState.value.tests.includes(filterValues.testsOption1))
    filterLogic.value.childFilters[filterKeys.tests].childFilters[
      filterValues.testsOption2
    ].setChecked(filterState.value.tests.includes(filterValues.testsOption2))
    filterLogic.value.childFilters[filterKeys.tests].childFilters[
      filterValues.testsOption3
    ].setChecked(filterState.value.tests.includes(filterValues.testsOption3))
    filterLogic.value.childFilters[filterKeys.tests].childFilters[
      filterValues.testsOption4
    ].setChecked(filterState.value.tests.includes(filterValues.testsOption4))

    // languages
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      filterValues.languageOption0
    ].setChecked(filterState.value.languages.includes(filterValues.languageOption0))
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      filterValues.languageOption1
    ].setChecked(filterState.value.languages.includes(filterValues.languageOption1))
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      filterValues.languageOption2
    ].setChecked(filterState.value.languages.includes(filterValues.languageOption2))

    filterLogicalValue.value = filterLogic.value.getBitfield()
  })

  return { filterLogicalValue }
}
