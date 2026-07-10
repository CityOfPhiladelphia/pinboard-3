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
  getBufferSize,
  type BitWiseOperation,
  type IFilterChoiceBitfield,
  type IFilterChoiceBitfieldGroup,
  type MatchingFunction,
} from '@pinboard/ui'
import type {
  AgeGroupFilter,
  LanguagesFilter,
  PrimaryCareFilterKey,
  PrimaryCareFilterLogic,
  PrimaryCareFilters,
  PrimaryCareLocation,
  PrimaryCareProperties,
  SpecialtyFilter,
  TestsFilter,
  VisitTypeFilter,
  WaitTimeFilter,
} from '@/types'

export function useFilterLogic(
  locations: Ref<PrimaryCareLocation[]>,
  filterState: Ref<PrimaryCareFilters>
) {
  const filterLogicalValue = ref<Uint32Array>(new Uint32Array())
  const matchYes = ['Yes']
  const matchYesEstPat = ['Yes', 'Established Patients']

  const matchFieldsToOptions: MatchingFunction = (
    item: Record<string, unknown>,
    fieldNames: string[],
    valuesToMatch: unknown[]
  ) => {
    const loc = item as unknown as PrimaryCareLocation
    return (fieldNames as (keyof PrimaryCareProperties)[]).some((fieldName) =>
      valuesToMatch.includes(loc.properties[fieldName])
    )
  }

  const matchOptionInString: MatchingFunction = (
    item: Record<string, unknown>,
    fieldNames: string[],
    valuesToMatch: unknown[]
  ) => {
    const loc = item as unknown as PrimaryCareLocation
    return (fieldNames as (keyof PrimaryCareProperties)[]).some((fieldName) =>
      (valuesToMatch as string[]).some((value) =>
        String(loc.properties[fieldName])
          .toLowerCase()
          .replace(/\s+/g, '')
          .split(',')
          .includes(String(value).toLowerCase().replace(/\s+/g, ''))
      )
    )
  }

  const filterLogic = computed(() => {
    const commonParams: Omit<IFilterChoiceBitfieldGroup, 'choices'> = {
      data: locations.value as unknown as Record<string, unknown>[],
      operation: '&',
      bufferLength: getBufferSize(locations.value.length),
    }

    const sameDayParams: Omit<IFilterChoiceBitfield, 'data' | 'bufferLength'> = {
      dataFields: ['walk_ins_sick', 'sick_adult_wait', 'sick_child_wait'],
      matches: ['Yes', 'Same day'],
      matchingFunction: matchFieldsToOptions,
    }
    const weekSickParams: Omit<IFilterChoiceBitfield, 'data' | 'bufferLength'> = {
      dataFields: sameDayParams.dataFields,
      matches: ['Yes', 'Same day', 'Less than one week'],
      matchingFunction: matchFieldsToOptions,
    }

    const weekWellParams: Omit<IFilterChoiceBitfield, 'data' | 'bufferLength'> = {
      dataFields: ['well_adult_wait', 'well_child_wait'],
      matches: ['Same day', 'Less than one week'],
      matchingFunction: matchFieldsToOptions,
    }

    const twoMonthsParams: Omit<IFilterChoiceBitfield, 'data' | 'bufferLength'> = {
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
    }

    const waitTimeFilter = makeFilterChoiceBitfieldGroup(commonParams, {
      [waitOptions[0]]: sameDayParams,
      [waitOptions[1]]: weekSickParams,
      [waitOptions[2]]: weekWellParams,
      [waitOptions[3]]: twoMonthsParams,
    })

    const languageFilter = makeFilterChoiceBitfieldGroup(
      commonParams,
      Object.fromEntries(
        Array.from(languageOptions, (lang) => [
          lang,
          {
            dataFields: ['languages'],
            matches: [lang],
            matchingFunction: matchOptionInString,
          },
        ])
      )
    )

    const ageGroupFilter = makeFilterChoiceBitfieldGroup(
      commonParams,
      choicesFromObject(ageGroupOptions, matchYes, matchFieldsToOptions)
    )
    const visitTypeFilter = makeFilterChoiceBitfieldGroup(
      commonParams,
      choicesFromObject(visitTypeOptions, matchYesEstPat, matchFieldsToOptions)
    )
    const specialtyFilter = makeFilterChoiceBitfieldGroup(
      commonParams,
      choicesFromObject(specialtyOptions, matchYesEstPat, matchFieldsToOptions)
    )
    const testsFilter = makeFilterChoiceBitfieldGroup(
      commonParams,
      choicesFromObject(testsOptions, matchYesEstPat, matchFieldsToOptions)
    )

    const filterLogicGroup = new FilterGroup({
      operation: commonParams.operation,
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
    Object.values(ageGroupOptions).forEach((filter) =>
      filterLogic.value.childFilters[filterKeys.ageGroup].childFilters[filter].setChecked(
        filterState.value.ageGroup[filter]
      )
    )

    // wait time
    waitOptions.forEach((filter) =>
      filterLogic.value.childFilters[filterKeys.waitTime].childFilters[filter].setChecked(
        filterState.value.waitTime[filter]
      )
    )

    // visit type
    Object.values(visitTypeOptions).forEach((filter) =>
      filterLogic.value.childFilters[filterKeys.visitType].childFilters[filter].setChecked(
        filterState.value.visitType[filter]
      )
    )

    // specialty
    Object.values(specialtyOptions).forEach((filter) =>
      filterLogic.value.childFilters[filterKeys.specialty].childFilters[filter].setChecked(
        filterState.value.visitType[filter]
      )
    )

    // function setAllChecked(
    //   arr:
    //     | AgeGroupFilter[]
    //     | WaitTimeFilter[]
    //     | VisitTypeFilter[]
    //     | SpecialtyFilter[]
    //     | TestsFilter[]
    //     | LanguagesFilter[],
    //   logicalFilterKey: string,
    //   filterChipKey: keyof Pick<
    //     PrimaryCareFilters,
    //     'ageGroup' | 'visitType' | 'waitTime' | 'languages'
    //   >
    // ): void {
    //   arr.forEach((filter) =>
    //     filterLogic.value.childFilters[logicalFilterKey].childFilters[filter].setChecked(
    //       filterState.value[filterChipKey][filter]
    //     )
    //   )
    // }

    // tests
    Object.values(testsOptions).forEach((filter) =>
      filterLogic.value.childFilters[filterKeys.tests].childFilters[filter].setChecked(
        filterState.value.visitType[filter]
      )
    )

    // languages
    languageOptions.forEach((filter) =>
      filterLogic.value.childFilters[filterKeys.languages].childFilters[filter].setChecked(
        filterState.value.languages[filter]
      )
    )

    filterLogicalValue.value = filterLogic.value.getBitfield()
  })

  return { filterLogicalValue, filterLogic }
}

function choicesFromObject(
  obj: Object,
  matches: string[],
  matchingFunction: MatchingFunction
): Record<string, Omit<IFilterChoiceBitfield, 'data' | 'bufferLength'>> {
  return Object.fromEntries(
    Array.from(Object.entries(obj), ([dataField, filterName]) => [
      filterName,
      {
        dataFields: [dataField],
        matches: matches,
        matchingFunction: matchingFunction,
      },
    ])
  )
}

function makeFilterChoiceBitfieldGroup(
  commonParams: Omit<IFilterChoiceBitfieldGroup, 'choices'>,
  choices: Record<string, Omit<IFilterChoiceBitfield, 'data' | 'bufferLength'>>
): FilterChoiceBitfieldGroup {
  return new FilterChoiceBitfieldGroup({
    ...commonParams,
    choices: choices,
  })
}
