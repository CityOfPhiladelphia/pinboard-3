import { FilterChoiceBitfieldGroup, FilterGroup } from './classes'

export type BitWiseOperation = '&' | '|' | '^'

// export interface ClassWithBitfieldGetter {
//   bitfield(activeFilters: string[]): Uint32Array<ArrayBufferLike>
// }

// export interface MatchingFunction {
//   <T>(item: Record<string, T>, dataFields: string[], matchValues: T[]): boolean
// }

export interface IFilterChoiceBitfield {
  data: Record<string, unknown>[]
  dataFields: string[]
  matches: string[]
  // matchingFunction: MatchingFunction
  matchingFunction: Function
}

export interface IFilterChoiceBitfieldGroup {
  operation: BitWiseOperation
  bufferLength: number
  data: Record<string, unknown>[]
  choices: Record<string, Omit<IFilterChoiceBitfield, 'data'>>
}

export interface IFilterGroup {
  operation: BitWiseOperation
  childFilters: Record<string, FilterChoiceBitfieldGroup | FilterGroup>
  bufferLength: number
}
