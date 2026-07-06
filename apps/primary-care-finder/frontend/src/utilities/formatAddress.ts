import type { PrimaryCareProperties } from '@/types'

export function formatFullAddress(properties: PrimaryCareProperties): string {
  const street = [properties.address, properties.address_2].filter(Boolean).join(', ')
  return `${street}, Philadelphia, PA ${properties.zip_code ?? ''}`.trimEnd()
}
