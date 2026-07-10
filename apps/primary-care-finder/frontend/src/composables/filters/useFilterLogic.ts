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
  PrimaryCareFilters,
  PrimaryCareLocation,
  PrimaryCareProperties,
  TestsFilter,
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

  const waitTimeFilterParams: Omit<
    IFilterChoiceBitfieldGroup,
    'data' | 'bufferLength' | 'operation'
  > = {
    choices: {
      [waitOptions[0]]: {
        dataFields: ['walk_ins_sick', 'sick_adult_wait', 'sick_child_wait'],
        matches: ['Yes', 'Same day'],
        matchingFunction: matchFieldsToOptions,
      },
      [waitOptions[1]]: {
        dataFields: ['walk_ins_sick', 'sick_adult_wait', 'sick_child_wait'],
        matches: ['Yes', 'Same day', 'Less than one week'],
        matchingFunction: matchFieldsToOptions,
      },
      [waitOptions[2]]: {
        dataFields: ['well_adult_wait', 'well_child_wait'],
        matches: ['Same day', 'Less than one week'],
        matchingFunction: matchFieldsToOptions,
      },
      [waitOptions[3]]: {
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

  const filterLogic = computed(() => {
    const commonParams = {
      data: locations.value as unknown as Record<string, unknown>[],
      operation: '&' as BitWiseOperation,
      bufferLength: getBufferSize(locations.value.length),
    }
    const ageGroupFilter = new FilterChoiceBitfieldGroup({
      ...commonParams,
      choices: choicesFromObject(ageGroupOptions, matchYes, matchFieldsToOptions),
    })
    const waitTimeFilter = new FilterChoiceBitfieldGroup({
      ...commonParams,
      ...waitTimeFilterParams,
    })

    const visitTypeFilter = new FilterChoiceBitfieldGroup({
      ...commonParams,
      choices: choicesFromObject(visitTypeOptions, matchYesEstPat, matchFieldsToOptions),
    })

    const specialtyFilter = new FilterChoiceBitfieldGroup({
      ...commonParams,
      choices: choicesFromObject(specialtyOptions, matchYesEstPat, matchFieldsToOptions),
    })

    const testsFilter = new FilterChoiceBitfieldGroup({
      ...commonParams,
      choices: choicesFromObject(testsOptions, matchYesEstPat, matchFieldsToOptions),
    })

    const languageFilter = new FilterChoiceBitfieldGroup({
      ...commonParams,
      choices: Object.fromEntries(
        Array.from(Object.values(languageOptions), (lang) => [
          lang,
          {
            dataFields: ['languages'],
            matches: [lang],
            matchingFunction: matchOptionInString,
          },
        ])
      ),
    })

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
