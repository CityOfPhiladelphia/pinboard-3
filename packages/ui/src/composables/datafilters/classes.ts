import { bitarrayBitwiseOperator, createOptionBitmask } from './functions'

import type {
  BitWiseOperation,
  ClassWithBitfieldGetter,
  IFilterChoiceBitfield,
  IFilterChoiceGroupBitfield,
} from './types'

class FilterChoiceBitfield {
  bitfield: Uint32Array
  constructor(params: IFilterChoiceBitfield) {
    this.bitfield = createOptionBitmask(
      params.data,
      params.dataFields,
      params.matches,
      params.matchingFunction
    )
  }
}

class FilterChoiceGroupBitfields implements ClassWithBitfieldGetter {
  private choiceBitfields: Record<string, Uint32Array>
  private operation: BitWiseOperation
  constructor(params: IFilterChoiceGroupBitfield) {
    if (
      ![params.dataFields.length, params.matches.length].every(
        (length) => length === params.choices.length
      )
    ) {
      throw new Error(
        `Length of fields [choices, dataFields, matches${Array.isArray(params.matchingFunction) ? ', matchingFunction' : ''}] must all match: choices.length = ${params.choices.length}, dataFields.length = ${params.dataFields.length}, matches.length = ${params.matches.length}${Array.isArray(params.matchingFunction) ? `, matchingFunction.length = ${params.matchingFunction.length}` : ''}`
      )
    }
    this.operation = params.operation
    const choiceKeys = Array.from(params.choices, (choice, i) => {
      return [
        choice.value,
        new FilterChoiceBitfield({
          data: params.data,
          dataFields: params.dataFields[i],
          matches: params.matches[i],
          matchingFunction: Array.isArray(params.matchingFunction)
            ? params.matchingFunction[i]
            : params.matchingFunction,
        }),
      ]
    })
    this.choiceBitfields = Object.fromEntries(choiceKeys)
  }

  bitfield(activeFilters: string[]) {
    return bitarrayBitwiseOperator(
      null,
      Array.from(activeFilters, (key) => this.choiceBitfields[key]),
      this.operation
    )
  }
}

export class FilterSetBitfield implements ClassWithBitfieldGetter {
  private operation: BitWiseOperation
  private childFilters: (FilterChoiceGroupBitfields | FilterSetBitfield)[]
  constructor(
    operation: BitWiseOperation,
    childFilters: (FilterChoiceGroupBitfields | FilterSetBitfield)[]
  ) {
    this.operation = operation
    this.childFilters = childFilters
  }

  bitfield(activeFilters: string[]): Uint32Array<ArrayBufferLike> {
    return bitarrayBitwiseOperator(
      null,
      Array.from(this.childFilters, (childFilter) => childFilter.bitfield(activeFilters)),
      this.operation
    )
  }
}
