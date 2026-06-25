import type { BasicLocation } from '../../types'
import { FilterChoiceBitfieldGroup, FilterGroup } from './classes'

export type BitWiseOperation = '&' | '|' | '^'

export interface MatchingFunction {
  <T>(
    item: BasicLocation & Record<string, unknown>,
    dataFields: string[],
    matchValues: T[]
  ): boolean
}

export interface IFilterChoiceBitfield {
  data: Record<string, unknown>[]
  bufferLength: number
  dataFields: string[]
  matches: string[]
  matchingFunction: MatchingFunction
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
