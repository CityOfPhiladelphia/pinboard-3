import type { BitWiseOperation, MatchingFunction } from './types'

function getShiftDirection() {
  const a = 0x02
  let b = a
  b <<= 1
  return b > a
}

export const getBufferSize = (dataLength: number) => {
  return Math.ceil(dataLength / 32)
}

export function createOptionBitmask(
  data: Record<string, unknown>[],
  bufferSize: number,
  dataFields: string[],
  matchValues: string[],
  matchingFunction: MatchingFunction
) {
  if (bufferSize < getBufferSize(data.length)) {
    throw new Error('Data too large to fit into buffer')
  }
  const bitarray = new Uint32Array(bufferSize) // bitArray for holding set bits
  const shiftDirection = getShiftDirection()
  let accumulator = 0 // accumulate set bits before being pushed into buffer
  let offset = 0 // tracks the offset for setting a bit in the accumulator
  let setBit = 1 // gets shifted to the left once every cycle to set bits in the accumulator

  // for each item, run bit setting function
  data.forEach((item) => {
    accumulator |= matchingFunction(item, dataFields, matchValues) ? setBit : 0

    // if 32nd bit of setBit is set, push accumulator to bitarray and reset loop for next iteration, else shift setBit
    if (setBit & 0x8000_0000) {
      bitarray[offset] = accumulator
      accumulator = 0 // reset accumulator
      setBit = 1 // reset setBit
      offset++ // increment offset for next push to buffer
    } else {
      setBit = shiftDirection ? setBit << 1 : setBit >> 1 // shift setBit to the left: 00000010 <<= 00000001
    }
  })

  // push remaining bits to buffer if forEach ended ended before pushing accumulator
  if (accumulator) {
    bitarray[offset] = accumulator
  }
  return bitarray
}

export const bitarrayBitwiseOperator = (
  bitarrayIn1: Uint32Array | null,
  otherBitarrays: Uint32Array | Uint32Array[],
  operation: BitWiseOperation
) => {
  otherBitarrays = Array.isArray(otherBitarrays)
    ? otherBitarrays.filter(Boolean)
    : [otherBitarrays].filter(Boolean)
  if ((otherBitarrays === null || otherBitarrays.length === 0) && bitarrayIn1) {
    return bitarrayIn1
  }
  if (bitarrayIn1 === null && otherBitarrays.length === 1) {
    return otherBitarrays[0]
  }
  if (bitarrayIn1 !== null) {
    otherBitarrays.push(bitarrayIn1)
  }
  const bufferLength = otherBitarrays[0].length
  if (
    Array.from(otherBitarrays, (bitarray) => bitarray.length).some(
      (length) => length !== bufferLength
    )
  ) {
    throw new Error('DataViews must all be equal length')
  }
  bitarrayIn1 = getUniformBitarray(bufferLength, operation === '&' ? 1 : 0)
  otherBitarrays.forEach((bitarray) => {
    for (let i = 0; i < bufferLength; i++) {
      switch (operation) {
        case '|': {
          bitarrayIn1[i] |= bitarray[i]
          break
        }
        case '&': {
          bitarrayIn1[i] &= bitarray[i]
          break
        }
        case '^': {
          bitarrayIn1[i] ^= bitarray[i]
          break
        }
        default: {
          throw new Error(`${operation} is not a valid operation`)
        }
      }
    }
  })
  return bitarrayIn1
}

export const getUniformBitarray = (bufferLength: number, oneOrZero: 1 | 0) => {
  return new Uint32Array(bufferLength).fill(oneOrZero ? 0xffffffff : 0)
}

export function applyFilters<T>(arr: T[], bits: Uint32Array): T[] {
  const shiftDirection = getShiftDirection()
  const filtered: T[] = []
  let checkBit = 1
  let offset = 0
  arr.forEach((item) => {
    if (checkBit & bits[offset]) {
      filtered.push(item)
    }

    if (checkBit & 0x8000_0000) {
      checkBit = 1
      offset++
    } else {
      checkBit = shiftDirection ? checkBit << 1 : checkBit >> 1
    }
  })
  return filtered
}
