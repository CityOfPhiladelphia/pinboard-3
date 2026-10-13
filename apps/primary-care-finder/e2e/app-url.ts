import { resolveAppUrl } from '@repo/playwright-config'

export const APP_URL = resolveAppUrl({
  test: 'https://test-primary-care.phila.gov/',
  prod: 'https://primary-care.phila.gov/',
})
