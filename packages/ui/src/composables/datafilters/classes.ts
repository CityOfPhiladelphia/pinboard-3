import {
  bitarrayBitwiseOperator,
  createOptionBitmask,
  findClassesInObject,
  getBufferSize,
  getUniformBitarray,
  // validateArrayLengthsMatch,
} from './functions'
import type { BitWiseOperation, SelectionType } from './types'

/*
    // COMPONENT ARGUMENT DATA SCRUCTURES
    */
class FilterOptionsGroupParams {
  groupLabelText: string
  optionLabels: string[]
  optionKeys: string[]
  operation: BitWiseOperation
  type: SelectionType
  groupToggle: string
  checked: boolean[]
  constructor(
    groupLabelText: string,
    optionLabels: string[],
    optionKeys: string[],
    operation: BitWiseOperation,
    type: SelectionType,
    groupToggle: string,
    checked: boolean | boolean[]
  ) {
    this.groupLabelText = groupLabelText
    this.optionLabels = optionLabels
    this.optionKeys = optionKeys
    this.operation = operation
    this.type = type
    this.groupToggle = groupToggle
    this.checked = Array.isArray(checked) ? checked : Array(optionKeys.length).fill(checked)
  }
}

export class DataFilterOptionsGroupParams extends FilterOptionsGroupParams {
  optionFields: [string | string[]]
  optionMatches: string[]
  optionBitSettingFunctions: Function[]
  constructor(
    groupLabelText: string,
    optionLabels: string[],
    optionKeys: string[],
    optionFields: string | [string | string[]],
    optionMatches: string | string[],
    optionBitSettingFunctions: Function | Function[],
    operation: BitWiseOperation = '|',
    type: SelectionType,
    groupToggle: string = '',
    checked: boolean = false
  ) {
    // if (
    //   !validateArrayLengthsMatch([
    //     optionLabels,
    //     optionKeys,
    //     optionFields,
    //     optionMatches,
    //     optionBitSettingFunctions,
    //     checked,
    //   ])
    // ) {
    //   throw new Error(
    //     `Arguments did not form valid params: ${optionLabels}, ${optionKeys}, ${optionFields}, ${optionMatches}, ${optionBitSettingFunctions}, ${checked}`
    //   )
    // }
    super(groupLabelText, optionLabels, optionKeys, operation, type, groupToggle, checked)
    this.optionFields = typeof optionFields === 'string' ? [optionFields] : optionFields
    this.optionMatches = Array.isArray(optionMatches) ? optionMatches : [optionMatches]
    this.optionBitSettingFunctions = Array.isArray(optionBitSettingFunctions)
      ? optionBitSettingFunctions
      : [optionBitSettingFunctions]
  }
}

export class ComputedFilterGroupParams extends FilterOptionsGroupParams {
  optionInputs: ComputedFilterGroupOptionParams[]
  constructor(
    groupLabelText: string,
    optionLabels: string[],
    optionKeys: string[],
    optionInputs: ComputedFilterGroupOptionParams[],
    operation: BitWiseOperation = '|',
    type: SelectionType = 'checkbox',
    groupToggle: string = '',
    checked: boolean = false
  ) {
    // if (!validateArrayLengthsMatch([optionLabels, optionKeys, optionInputs, checked])) {
    //   throw new Error(
    //     `Arguments did not form valid params: ${optionLabels}, ${optionKeys}, ${optionInputs}, ${checked}`
    //   )
    // }
    super(groupLabelText, optionLabels, optionKeys, operation, type, groupToggle, checked)
    this.optionInputs = optionInputs
  }
}

class ComputedFilterGroupOptionParams {
  filterGroupSet: Record<
    string,
    | DataFilterOption
    | ComputedFilterOption
    | FilterGroupSet
    | DataFilterOptionsGroup
    | ComputedFilterGroup
  >
  filterGroupOptions: Record<string, Record<string, string>>
  constructor(
    filterGroupSet: FilterGroupSet,
    groupKeys: string[],
    keyValueSets: Record<string, string>[]
  ) {
    // if (!validateArrayLengthsMatch([groupKeys, keyValueSets])) {
    //   throw new Error(`Arguments did not form valid params: ${groupKeys}, ${keyValueSets}`)
    // }
    this.filterGroupSet = filterGroupSet['children']
    this.filterGroupOptions = Object.fromEntries(
      Array.from(groupKeys, (groupKey, i) => [groupKey, keyValueSets[i]])
    )
  }
}

/*
    // OPTION DATA STRUCTURES
    */
class FilterOption {
  label: string
  type: SelectionType
  checked: boolean
  constructor(label: string, type: SelectionType, checked: boolean) {
    this.label = label
    this.type = type
    this.checked = checked
  }
}

class DataFilterOption extends FilterOption {
  fields: string[]
  matches: string[]
  bitfields: Record<string, Uint32Array>
  constructor(
    label: string,
    optionKey: string,
    optionFields: string | string[],
    optionMatches: string[],
    bitSettingFunction: Function,
    operation: BitWiseOperation,
    type: SelectionType,
    checked: boolean,
    data: Record<string, unknown>[]
  ) {
    super(label, type, checked)
    this.fields = Array.isArray(optionFields) ? optionFields : [optionFields]
    this.matches = optionMatches
    this.bitfields = Object.fromEntries(
      Array.from(this.fields, (fieldName) => [
        this.fields.length === 1 ? optionKey : fieldName,
        createOptionBitmask(data, fieldName, optionMatches, bitSettingFunction),
      ])
    )
    this.bitfields?.[optionKey] ??
      bitarrayBitwiseOperator(null, Object.values(this.bitfields), operation)
  }
}

class ComputedFilterOption extends FilterOption {
  bitfields: Record<string, Uint32Array>
  constructor(
    label: string,
    optionKey: string,
    computedOptionInputs: ComputedFilterGroupOptionParams | ComputedFilterGroupOptionParams[],
    operation: BitWiseOperation,
    type: SelectionType,
    checked: boolean
  ) {
    super(label, type, checked)
    // this.bitfields = {}
    // this.bitfields[optionKey] = null
    computedOptionInputs = Array.isArray(computedOptionInputs)
      ? computedOptionInputs
      : [computedOptionInputs]
    computedOptionInputs.forEach((inputGroup) => {
      Object.keys(inputGroup.filterGroupOptions).forEach((optionGroupKey) => {
        Object.keys(inputGroup.filterGroupOptions[optionGroupKey]).forEach((optionOptionKey) => {
          this.bitfields[optionKey] = bitarrayBitwiseOperator(
            inputGroup.filterGroupSet[optionGroupKey]['children'][optionOptionKey].bitfields[
              inputGroup.filterGroupOptions[optionGroupKey][optionOptionKey]
            ],
            this.bitfields[optionKey],
            operation
          )
        })
      })
    })
  }
}

/*
    // OPTION GROUP DATA STRUCTURES
    */
class FilterGroup {
  children: Record<
    string,
    | DataFilterOption
    | DataFilterOptionsGroup
    | ComputedFilterOption
    | ComputedFilterGroup
    | FilterGroupSet
  >
  operation: BitWiseOperation
  constructor(
    childrenObject: Record<
      string,
      | DataFilterOption
      | DataFilterOptionsGroup
      | ComputedFilterOption
      | ComputedFilterGroup
      | FilterGroupSet
    >,
    operation: BitWiseOperation
  ) {
    this.children = childrenObject
    this.operation = operation
  }
  get checked() {
    return Array.from(Object.values(this.children), (child) => child.checked).some(
      (childValue) => childValue === true
    )
  }
}

export class FilterGroupSet extends FilterGroup {
  constructor(
    filterGroupsObject: Record<
      string,
      | DataFilterOption
      | ComputedFilterOption
      | DataFilterOptionsGroup
      | ComputedFilterGroup
      | FilterGroupSet
    >,
    operation: BitWiseOperation = '|'
  ) {
    super(filterGroupsObject, operation)
  }
  get bitfield() {
    return bitarrayBitwiseOperator(
      null,
      Array.from(Object.values(this.children), (child) => child.bitfield),
      this.operation
    )
  }
}

export class FilterPanel extends FilterGroupSet {
  bufferLength: number
  filters: Record<string, FilterGroupSet>
  constructor(
    filterGroupsObject: FilterGroupSet,
    data: Array<unknown>,
    operation: BitWiseOperation = '|'
  ) {
    super(filterGroupsObject, operation)
    this.bufferLength = getBufferSize(data.length)
    this.filters = Object.fromEntries(
      findClassesInObject(this, 'children', [DataFilterOptionsGroup, ComputedFilterGroup])
    )
  }
  get bitfield() {
    return this.checked ? super.bitfield : getUniformBitarray(this.bufferLength, 1)
  }
}

class FilterOptionsGroup extends FilterGroup {
  label: string
  groupToggle: string
  constructor(
    label: string,
    optionsObject: Record<string, DataFilterOption>,
    operation: BitWiseOperation,
    groupToggle: string
  ) {
    super(optionsObject, operation)
    this.label = label
    this.groupToggle = groupToggle
  }
  get toggleStatus() {
    return this.groupToggle ? this.children[this.groupToggle].checked : false
  }
  get bitfield() {
    if (this.toggleStatus) {
      return this.children[this.groupToggle].bitfields[this.groupToggle]
    }
    return bitarrayBitwiseOperator(
      null,
      Array.from(Object.keys(this.children), (optionKey) =>
        optionKey !== this.groupToggle && this.children[optionKey].checked
          ? this.children[optionKey].bitfields[optionKey]
          : null
      ),
      this.operation
    )
  }
}

export class DataFilterOptionsGroup extends FilterOptionsGroup {
  constructor(filterOptionsGroupParams, data) {
    super(
      filterOptionsGroupParams.groupLabelText,
      Object.fromEntries(
        Array.from(filterOptionsGroupParams.optionLabels, (labelText, i) => [
          filterOptionsGroupParams.optionKeys[i],
          new DataFilterOption(
            labelText,
            filterOptionsGroupParams.optionKeys[i],
            Array.isArray(filterOptionsGroupParams.optionFields[0])
              ? filterOptionsGroupParams.optionFields[i]
              : filterOptionsGroupParams.optionFields,
            Array.isArray(filterOptionsGroupParams.optionMatches[0])
              ? filterOptionsGroupParams.optionMatches[i]
              : filterOptionsGroupParams.optionMatches,
            filterOptionsGroupParams.optionBitSettingFunctions.length !== 1
              ? filterOptionsGroupParams.optionBitSettingFunctions[i]
              : filterOptionsGroupParams.optionBitSettingFunctions[0],
            filterOptionsGroupParams['operation'],
            filterOptionsGroupParams.type,
            filterOptionsGroupParams.checked[i],
            data
          ),
        ])
      ),
      filterOptionsGroupParams['operation'],
      filterOptionsGroupParams.groupToggle
    )
  }
}

export class ComputedFilterGroup extends FilterOptionsGroup {
  constructor(computedFilterOptionsGroupParams) {
    super(
      computedFilterOptionsGroupParams.groupLabelText,
      Object.fromEntries(
        Array.from(computedFilterOptionsGroupParams.optionLabels, (labelText, i) => [
          computedFilterOptionsGroupParams.optionKeys[i],
          new ComputedFilterOption(
            labelText,
            computedFilterOptionsGroupParams.optionKeys[i],
            computedFilterOptionsGroupParams.optionInputs[i],
            computedFilterOptionsGroupParams['operation'],
            computedFilterOptionsGroupParams.type,
            computedFilterOptionsGroupParams.checked[i]
          ),
        ])
      ),
      computedFilterOptionsGroupParams['operation'],
      computedFilterOptionsGroupParams.groupToggle
    )
  }
}
