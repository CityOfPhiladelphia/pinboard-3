import { resolveAppUrl } from '@repo/playwright-config'

export const APP_URL = resolveAppUrl({
  test: 'https://flood-monitoring-test.phila.gov/',
  prod: 'https://flood-monitoring.phila.gov/',
})
