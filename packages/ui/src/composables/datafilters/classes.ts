import {
  bitarrayBitwiseOperator,
  createOptionBitmask,
  findClassesInObject,
  getBufferSize,
  getUniformBitarray,
  validateArrayLengthsMatch,
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
  checked: boolean | boolean[]
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
  optionFields: string[] | string[][]
  optionMatches: string[] | string[][]
  optionBitSettingFunctions: Function | Function[]
  constructor(
    groupLabelText: string,
    optionLabels: string[],
    optionKeys: string[],
    optionFields: string[] | string[][],
    optionMatches: string[] | string[][],
    optionBitSettingFunctions: Function | Function[],
    operation: BitWiseOperation = '|',
    type: SelectionType,
    groupToggle: string = '',
    checked: boolean = false
  ) {
    if (
      !validateArrayLengthsMatch([
        optionLabels,
        optionKeys,
        optionFields,
        optionMatches,
        optionBitSettingFunctions,
        checked,
      ])
    ) {
      throw new Error(
        `Arguments did not form valid params: ${optionLabels}, ${optionKeys}, ${optionFields}, ${optionMatches}, ${optionBitSettingFunctions}, ${checked}`
      )
    }
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
    if (!validateArrayLengthsMatch([optionLabels, optionKeys, optionInputs, checked])) {
      throw new Error(
        `Arguments did not form valid params: ${optionLabels}, ${optionKeys}, ${optionInputs}, ${checked}`
      )
    }
    super(groupLabelText, optionLabels, optionKeys, operation, type, groupToggle, checked)
    this.optionInputs = optionInputs
  }
}

class ComputedFilterGroupOptionParams {
  filterGroupSet
  filterGroupOptions
  constructor(
    filterGroupSet: FilterGroupSet,
    groupKeys: string[],
    keyValueSets: Record<string, string>
  ) {
    if (!validateArrayLengthsMatch([groupKeys, keyValueSets])) {
      throw new Error(`Arguments did not form valid params: ${groupKeys}, ${keyValueSets}`)
    }
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
  fields: string[] | string[][]
  matches: string[] | string[][]
  bitfields
  constructor(
    label: string,
    optionKey: string,
    optionFields: string[] | string[][],
    optionMatches: string[] | string[][],
    bitSettingFunction: Function,
    operation: BitWiseOperation,
    type: SelectionType,
    checked: boolean,
    data: Record<string, unknown>[]
  ) {
    super(label, type, checked)
    this.fields = optionFields
    this.matches = optionMatches
    this.bitfields = Object.fromEntries(
      Array.from(optionFields, (fieldName) => [
        optionFields.length === 1 ? optionKey : fieldName,
        createOptionBitmask(data, fieldName, optionMatches, bitSettingFunction),
      ])
    )
    this.bitfields[optionKey] =
      optionFields.length > 1
        ? bitarrayBitwiseOperator(null, Object.values(this.bitfields), operation)
        : this.bitfields[optionKey]
  }
}

class ComputedFilterOption extends FilterOption {
  constructor(label, optionKey, computedOptionInputs, operation, type, checked) {
    super(label, type, checked)
    this.bitfields = {}
    this.bitfields[optionKey] = null
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
  children: DataFilterOption | ComputedFilterOption
  operation: BitWiseOperation
  constructor(
    childrenObject: DataFilterOption | ComputedFilterOption,
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

class FilterGroupSet extends FilterGroup {
  constructor(
    filterGroupsObject: DataFilterOption | ComputedFilterOption | ,
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

class FilterPanel extends FilterGroupSet {
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
    optionsObject: DataFilterOptionsGroup | ComputedFilterGroup,
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
