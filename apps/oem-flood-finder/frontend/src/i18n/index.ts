import { createI18n } from 'vue-i18n'
import { pinboardMessages, mergeDeep } from '@pinboard/ui'
import en from './en'

// oem stays English-only; it merges the shell defaults so @pinboard/ui's
// useI18n() calls resolve. No app catalog yet, no language switcher.
const appMessages = { en }
const messages = mergeDeep(pinboardMessages, appMessages)

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
})

export default i18n
