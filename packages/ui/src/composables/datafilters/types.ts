import { bitarrayBitwiseOperator, createOptionBitmask, getUniformBitarray } from './functions'
import type { FilterValues } from '../..'

type BitWiseOperation = '&' | '|' | '^'

interface ClassWithBitfieldGetter {
  bitfield(activeFilters: string[]): Uint32Array<ArrayBufferLike>
}

interface MatchingFunction {
  <T>(item: Record<string, T>, dataFields: string[], matchValues: T[]): boolean
}

export interface IFilterChoiceBitfield {
  data: Record<string, unknown>[]
  dataFields: string[]
  matches: string[]
  matchingFunction: MatchingFunction
}

export class FilterChoiceBitfield {
  private bitfield: Uint32Array
  private checked: boolean = false

  constructor(params: IFilterChoiceBitfield) {
    this.bitfield = createOptionBitmask(
      params.data,
      params.dataFields,
      params.matches,
      params.matchingFunction
    )
  }

  getBitfield() {
    return this.checked ? this.bitfield : getUniformBitarray(this.bitfield.length, 0)
  }

  getChecked() {
    return this.checked
  }

  setChecked(checked: boolean) {
    this.checked = checked
  }
}

interface IFilterChoiceBitfieldGroup {
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

class FilterChoiceBitfieldGroup implements ClassWithBitfieldGetter {
  private choiceBitfields: Record<string, FilterChoiceBitfield> = {}
  private operation: BitWiseOperation
  constructor(params: IFilterChoiceBitfieldGroup) {
    this.operation = params.operation
    Object.entries(params.choices).forEach((choice) => {
      this.choiceBitfields[choice[0]] = new FilterChoiceBitfield({
        data: params.data,
        dataFields: choice[1].dataFields,
        matches: choice[1].matches,
        matchingFunction: choice[1].matchingFunction,
      })
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
  childFilters: Record<string, FilterChoiceBitfieldGroup | FilterSet>
}

class FilterSet implements ClassWithBitfieldGetter {
  private operation: BitWiseOperation
  private childFilters: Record<string, FilterChoiceBitfieldGroup | FilterSet>
  constructor(params: IFilterSet) {
    this.operation = params.operation
    this.childFilters = params.childFilters
  }

  bitfield(activeFilters: string[]): Uint32Array<ArrayBufferLike> {
    return bitarrayBitwiseOperator(
      null,
      Array.from(Object.values(this.childFilters), (childFilter) =>
        childFilter.bitfield(activeFilters)
      ),
      this.operation
    )
  }
}

export type { BitWiseOperation, MatchingFunction, IFilterChoiceBitfieldGroup, IFilterSet }
export { FilterChoiceBitfieldGroup, FilterSet }
