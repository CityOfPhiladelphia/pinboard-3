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
  type IFilterChoiceBitfieldGroup,
  type MatchingFunction,
} from '@pinboard/ui'
import type { PrimaryCareFilters, PrimaryCareLocation, PrimaryCareProperties } from '@/types'

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

  const visitTypeFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
    operation: '&',
    choices: {
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
    },
  }

  const specialtyFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
    operation: '&',
    choices: {
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
    },
  }

  const testsFilterParams: Omit<IFilterChoiceBitfieldGroup, 'data' | 'bufferLength'> = {
    operation: '&',
    choices: {
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
        matches: [languageOptions.languageOption0],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption1]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption1],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption2]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption2],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption3]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption3],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption4]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption4],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption5]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption5],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption6]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption6],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption7]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption7],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption9]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption9],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption10]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption10],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption11]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption11],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption12]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption12],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption13]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption13],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption14]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption14],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption15]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption15],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption16]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption16],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption17]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption17],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption18]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption18],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption19]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption19],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption20]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption20],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption21]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption21],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption22]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption22],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption23]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption23],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption24]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption24],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption25]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption25],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption26]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption26],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption27]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption27],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption28]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption28],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption29]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption29],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption30]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption30],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption31]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption31],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption32]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption32],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption33]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption33],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption34]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption34],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption35]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption35],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption36]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption36],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption37]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption37],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption38]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption38],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption39]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption39],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption40]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption40],
        matchingFunction: matchOptionInString,
      },
      [languageOptions.languageOption41]: {
        dataFields: ['languages'],
        matches: [languageOptions.languageOption41],
        matchingFunction: matchOptionInString,
      },
    },
  }

  const filterLogic = computed(() => {
    const commonParams = {
      data: locations.value as unknown as Record<string, unknown>[],
      bufferLength: getBufferSize(locations.value.length),
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
      ageGroupOptions.ageGroupOption0
    ].setChecked(filterState.value.ageGroup.adult)
    filterLogic.value.childFilters[filterKeys.ageGroup].childFilters[
      ageGroupOptions.ageGroupOption1
    ].setChecked(filterState.value.ageGroup.children)

    // wait time
    filterLogic.value.childFilters[filterKeys.waitTime].childFilters[
      waitOptions.waitOption0
    ].setChecked(filterState.value.waitTime.sameDay)
    filterLogic.value.childFilters[filterKeys.waitTime].childFilters[
      waitOptions.waitOption1
    ].setChecked(filterState.value.waitTime.weekSick)
    filterLogic.value.childFilters[filterKeys.waitTime].childFilters[
      waitOptions.waitOption2
    ].setChecked(filterState.value.waitTime.weekWell)
    filterLogic.value.childFilters[filterKeys.waitTime].childFilters[
      waitOptions.waitOption3
    ].setChecked(filterState.value.waitTime.twoMonths)

    // visit type
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      visitTypeOptions.visitTypeOption0
    ].setChecked(filterState.value.visitType.primaryWell)
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      visitTypeOptions.visitTypeOption1
    ].setChecked(filterState.value.visitType.primarySick)
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      visitTypeOptions.visitTypeOption2
    ].setChecked(filterState.value.visitType.primarySports)
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      visitTypeOptions.visitTypeOption3
    ].setChecked(filterState.value.visitType.primaryPrenatal)
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      visitTypeOptions.visitTypeOption4
    ].setChecked(filterState.value.visitType.primaryWomen)
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      visitTypeOptions.visitTypeOption5
    ].setChecked(filterState.value.visitType.primaryTelehealth)
    filterLogic.value.childFilters[filterKeys.visitType].childFilters[
      visitTypeOptions.visitTypeOption6
    ].setChecked(filterState.value.visitType.primaryVaccines)

    // specialty
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      specialtyOptions.specialtyOption0
    ].setChecked(filterState.value.visitType.mental)
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      specialtyOptions.specialtyOption1
    ].setChecked(filterState.value.visitType.dental)
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      specialtyOptions.specialtyOption2
    ].setChecked(filterState.value.visitType.eye)
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      specialtyOptions.specialtyOption3
    ].setChecked(filterState.value.visitType.podiatry)
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      specialtyOptions.specialtyOption4
    ].setChecked(filterState.value.visitType.mat)
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      specialtyOptions.specialtyOption5
    ].setChecked(filterState.value.visitType.nutrition)
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      specialtyOptions.specialtyOption6
    ].setChecked(filterState.value.visitType.tobacco)
    filterLogic.value.childFilters[filterKeys.specialty].childFilters[
      specialtyOptions.specialtyOption7
    ].setChecked(filterState.value.visitType.pharmacy)

    // tests
    filterLogic.value.childFilters[filterKeys.tests].childFilters[
      testsOptions.testsOption0
    ].setChecked(filterState.value.visitType.blood)
    filterLogic.value.childFilters[filterKeys.tests].childFilters[
      testsOptions.testsOption1
    ].setChecked(filterState.value.visitType.sti)
    filterLogic.value.childFilters[filterKeys.tests].childFilters[
      testsOptions.testsOption2
    ].setChecked(filterState.value.visitType.covid)
    filterLogic.value.childFilters[filterKeys.tests].childFilters[
      testsOptions.testsOption3
    ].setChecked(filterState.value.visitType.mammo)
    filterLogic.value.childFilters[filterKeys.tests].childFilters[
      testsOptions.testsOption4
    ].setChecked(filterState.value.visitType.xray)

    // languages
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption0
    ].setChecked(filterState.value.languages.asl)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption1
    ].setChecked(filterState.value.languages.amharic)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption2
    ].setChecked(filterState.value.languages.arabic)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption3
    ].setChecked(filterState.value.languages.bengali)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption4
    ].setChecked(filterState.value.languages.burmese)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption5
    ].setChecked(filterState.value.languages.cambodian)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption6
    ].setChecked(filterState.value.languages.cantonese)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption7
    ].setChecked(filterState.value.languages.chinese)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption9
    ].setChecked(filterState.value.languages.fanta)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption10
    ].setChecked(filterState.value.languages.filipino)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption11
    ].setChecked(filterState.value.languages.french)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption12
    ].setChecked(filterState.value.languages.frenchcreole)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption13
    ].setChecked(filterState.value.languages.fula)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption14
    ].setChecked(filterState.value.languages.gujarati)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption15
    ].setChecked(filterState.value.languages.haitiancreole)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption16
    ].setChecked(filterState.value.languages.hebrew)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption17
    ].setChecked(filterState.value.languages.hindi)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption18
    ].setChecked(filterState.value.languages.indonesian)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption19
    ].setChecked(filterState.value.languages.karen)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption20
    ].setChecked(filterState.value.languages.khmer)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption21
    ].setChecked(filterState.value.languages.kinyarwanda)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption22
    ].setChecked(filterState.value.languages.kirundi)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption23
    ].setChecked(filterState.value.languages.koloqua)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption24
    ].setChecked(filterState.value.languages.korean)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption25
    ].setChecked(filterState.value.languages.lebanese)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption26
    ].setChecked(filterState.value.languages.malayalam)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption27
    ].setChecked(filterState.value.languages.malaysian)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption28
    ].setChecked(filterState.value.languages.mandarin)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption29
    ].setChecked(filterState.value.languages.nepali)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption30
    ].setChecked(filterState.value.languages.portuguese)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption31
    ].setChecked(filterState.value.languages.punjabi)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption32
    ].setChecked(filterState.value.languages.shanghainese)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption33
    ].setChecked(filterState.value.languages.sinhalese)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption34
    ].setChecked(filterState.value.languages.spanish)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption35
    ].setChecked(filterState.value.languages.swahili)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption36
    ].setChecked(filterState.value.languages.tagalog)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption37
    ].setChecked(filterState.value.languages.taiwanese)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption38
    ].setChecked(filterState.value.languages.telugu)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption39
    ].setChecked(filterState.value.languages.urdu)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption40
    ].setChecked(filterState.value.languages.vietnamese)
    filterLogic.value.childFilters[filterKeys.languages].childFilters[
      languageOptions.languageOption41
    ].setChecked(filterState.value.languages.yoruba)

    filterLogicalValue.value = filterLogic.value.getBitfield()
  })

  return { filterLogicalValue, filterLogic }
}
