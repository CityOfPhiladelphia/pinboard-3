import { defineSmokeTests } from '@repo/playwright-config'
import { APP_URL } from './app-url'

defineSmokeTests({
  name: 'Flood monitoring map',
  url: APP_URL,
  title: /Flood Monitoring Map/i,
  searchValue: 'Cobbs Creek',
})
