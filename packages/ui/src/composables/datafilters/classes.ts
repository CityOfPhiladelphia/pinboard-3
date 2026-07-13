import { bitarrayBitwiseOperator, createOptionBitmask, getUniformBitarray } from './functions'
import type {
  BitWiseOperation,
  IFilterChoiceBitfield,
  IFilterChoiceBitfieldGroup,
  IFilterGroup,
} from './types'

class FilterChoiceBitfield {
  private bitfield: Uint32Array
  private checked: boolean = false

  constructor(params: IFilterChoiceBitfield) {
    this.bitfield = createOptionBitmask(
      params.data,
      params.bufferLength,
      params.dataFields,
      params.matches,
      params.matchingFunction
    )
  }

  getChecked() {
    return this.checked
  }

  setChecked(checked: boolean) {
    this.checked = checked
  }

  getBitfield() {
    return this.bitfield
  }
}

class FilterChoiceBitfieldGroup {
  private childFilters: Record<string, FilterChoiceBitfield> = {}
  private operation: BitWiseOperation
  private bufferLength: number
  private checked: boolean = false
  constructor(params: IFilterChoiceBitfieldGroup) {
    this.operation = params.operation
    this.bufferLength = params.bufferLength
    Object.entries(params.choices).forEach((choice) => {
      this.childFilters[choice[0]] = new FilterChoiceBitfield({
        data: params.data,
        bufferLength: params.bufferLength,
        dataFields: choice[1].dataFields,
        matches: choice[1].matches,
        matchingFunction: choice[1].matchingFunction,
      })
    })
  }

  getChildFilter(filterName: string) {
    return this.childFilters[filterName]
  }

  getChecked() {
    this.setChecked()
    return this.checked
  }

  setChecked() {
    this.checked = false
    for (const choice of Object.values(this.childFilters)) {
      this.checked = this.checked || choice.getChecked()
    }
  }

  getBitfield(): Uint32Array {
    if (this.getChecked()) {
      const checkedBitfields: Uint32Array[] = []
      Object.values(this.childFilters).forEach((choice) => {
        if (choice.getChecked()) {
          checkedBitfields.push(choice.getBitfield())
        }
      })
      return bitarrayBitwiseOperator(null, checkedBitfields, this.operation)
    }

    return getUniformBitarray(this.bufferLength, 0)
  }
}

class FilterGroup {
  private childFilters: Record<string, FilterChoiceBitfieldGroup | FilterGroup>
  private operation: BitWiseOperation
  private bufferLength: number
  private checked: boolean = false
  constructor(params: IFilterGroup) {
    this.operation = params.operation
    this.childFilters = params.childFilters
    this.bufferLength = params.bufferLength
  }

  getChildFilter(filterName: string) {
    return this.childFilters[filterName]
  }

  getBufferLength() {
    return this.bufferLength
  }

  getBitfield(): Uint32Array {
    if (this.getChecked()) {
      const checkedBitfields: Uint32Array[] = []
      Object.values(this.childFilters).forEach((choice) => {
        if (choice.getChecked()) {
          checkedBitfields.push(choice.getBitfield())
        }
      })
      return bitarrayBitwiseOperator(null, checkedBitfields, this.operation)
    }

    return getUniformBitarray(this.bufferLength, this.operation === '&' ? 1 : 0)
  }

  getChecked() {
    this.setChecked()
    return this.checked
  }

  setChecked() {
    this.checked = false
    for (const choice of Object.values(this.childFilters)) {
      choice.setChecked()
      this.checked = this.checked || choice.getChecked()
    }
  }
}

export { FilterChoiceBitfieldGroup, FilterGroup, FilterChoiceBitfield }
