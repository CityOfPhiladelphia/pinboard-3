import { bitarrayBitwiseOperator, createOptionBitmask } from './functions'

type BitWiseOperation = '&' | '|' | '^'

interface ClassWithBitfieldGetter {
  bitfield(activeFilters: string[]): Uint32Array<ArrayBufferLike>
}

interface MatchingFunction {
  (item: Record<string, unknown>, dataField: string, matchValues: string[]): boolean
}

interface IFilterChoiceGroup {
  operation: BitWiseOperation
  data: Record<string, unknown>[]
  choices: Record<
    string,
    {
      dataFields: string[]
      matches: string[]
      matchingFunction: MatchingFunction
    }
  >
}

class FilterChoiceGroup implements ClassWithBitfieldGetter {
  private choiceBitfields: Record<string, Uint32Array>
  private operation: BitWiseOperation
  constructor(params: IFilterChoiceGroup) {
    this.operation = params.operation
    Object.entries(params.choices).forEach((choice) => {
      this.choiceBitfields[choice[0]] = createOptionBitmask(
        params.data,
        choice[1].dataFields,
        choice[1].matches,
        choice[1].matchingFunction
      )
    })
  }

  bitfield(activeFilters: string[]) {
    return bitarrayBitwiseOperator(
      null,
      Array.from(activeFilters, (key) => this.choiceBitfields[key]),
      this.operation
    )
  }
}

interface IFilterSet {
  operation: BitWiseOperation
  childFilters: (FilterChoiceGroup | FilterSet)[]
}

class FilterSet implements ClassWithBitfieldGetter {
  private operation: BitWiseOperation
  private childFilters: (FilterChoiceGroup | FilterSet)[]
  constructor(params: IFilterSet) {
    this.operation = params.operation
    this.childFilters = params.childFilters
  }

  bitfield(activeFilters: string[]): Uint32Array<ArrayBufferLike> {
    return bitarrayBitwiseOperator(
      null,
      Array.from(this.childFilters, (childFilter) => childFilter.bitfield(activeFilters)),
      this.operation
    )
  }
}

export type { BitWiseOperation, MatchingFunction, IFilterChoiceGroup, IFilterSet }
export { FilterChoiceGroup, FilterSet }
