import { createI18n } from 'vue-i18n'
import { pinboardMessages, mergeDeep } from '@pinboard/ui'

// oem stays English-only; it merges the shell defaults so @pinboard/ui's
// useI18n() calls resolve. No app catalog yet, no language switcher.
const messages = mergeDeep(pinboardMessages, { en: {} })

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
})

export default i18n
