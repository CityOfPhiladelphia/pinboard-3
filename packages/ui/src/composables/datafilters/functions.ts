import type { BitWiseOperation, MatchingFunction } from './types'

/*
    // HELPER FUNCTIONS
    */
export const getBufferSize = (dataLength: number) => {
  return Math.ceil(dataLength / 32)
}

export const getAllUniqueValuesFromStringField = (
  dataProperties: Record<string, string>[],
  field: string,
  delim: string
) => {
  const unique = new Set()
  for (const item of dataProperties) {
    item[field].split(delim).forEach((substring) => unique.add(substring.trim()))
  }
  return [...unique]
}

function isBigEndian() {
  const a = 0x02
  let b = a
  b <<= 1
  return b > a
}

/*
    // BIT MANIPULATING FUNCTIONS
    */
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
  const shiftLeft = isBigEndian()
  let accumulator = 0 // accumulate set bits before being pushed into buffer
  let offset = 0 // tracks the offset for setting a bit in the accumulator
  let setBit = 1 // gets shifted to the left once every cycle to set bits in the accumulator

  // for each item, run bit setting function
  data.forEach((item) => {
    accumulator |= matchingFunction(item, dataFields, matchValues) ? setBit : 0
    setBit = shiftLeft ? setBit << 1 : setBit >> 1 // shift setBit to the left: 00000010 <<= 00000001

    // after 32nd iteration, push bits to buffers and reset accumulators and setBit
    if (setBit & 0x100000000) {
      bitarray[offset] = accumulator
      accumulator = 0 // reset accumulator
      setBit = 1 // reset setBit
      offset++ // increment offset for next push to buffer
    }
  })

  // push remaining bits to buffer if forEach ended when i % 32 != 31
  if (accumulator) {
    bitarray[offset] = accumulator
  }
  return bitarray
}

export const bitarrayBitwiseOperator = (
  bitarrayIn1: Uint32Array | null,
  otherBitarrays: Uint32Array[],
  operation: BitWiseOperation = '|'
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

/*
    // INPUT FUNCTIONS FOR GETTING BITFIELDS
    */
export const matchFieldToOptions = (
  item: Record<string, unknown>,
  fieldName: string,
  valuesToMatch: unknown[]
) => {
  return valuesToMatch.includes(item[fieldName])
}

export const matchOptionInString = (
  item: Record<string, string>,
  fieldName: string,
  option: string
) => {
  return item[fieldName].toLowerCase().trim().includes(option[0])
}
