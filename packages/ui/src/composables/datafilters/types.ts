import type { FilterChoice } from '../../index'

export type BitWiseOperation = '&' | '|' | '^'

export interface IFilterChoiceBitfield {
  data: Record<string, unknown>[]
  dataFields: string[]
  matches: string[]
  matchingFunction: MatchingFunction
}

export interface IFilterChoiceGroupBitfield {
  operation: BitWiseOperation
  choices: FilterChoice[]
  data: Record<string, unknown>[]
  dataFields: string[][]
  matches: string[][]
  matchingFunction: MatchingFunction | MatchingFunction[]
}

export interface ClassWithBitfieldGetter {
  bitfield(activeFilters: string[]): Uint32Array<ArrayBufferLike>
}

export interface MatchingFunction {
  (data: Record<string, unknown>[], dataFields: string[], matchValues: string[]): boolean
}
