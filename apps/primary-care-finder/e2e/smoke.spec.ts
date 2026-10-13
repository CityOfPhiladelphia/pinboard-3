import { defineSmokeTests } from '@repo/playwright-config'
import { APP_URL } from './app-url'

defineSmokeTests({
  name: 'Primary care finder',
  url: APP_URL,
  title: /Primary care finder/i,
  searchValue: '19104',
})
