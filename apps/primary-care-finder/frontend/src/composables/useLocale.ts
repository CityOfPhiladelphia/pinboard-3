import { useI18n } from 'vue-i18n'
import { languageCodes } from '@pinboard/ui'

const STORAGE_KEY = 'pcf.locale'
const DEFAULT_LOCALE = 'en'

function isValid(code: string | null): code is string {
  return !!code && languageCodes.has(code)
}

/** Resolves the initial locale: ?lang= → localStorage → default. */
export function resolveInitialLocale(search: string, stored: string | null): string {
  const param = new URLSearchParams(search).get('lang')
  if (isValid(param)) return param
  if (isValid(stored)) return stored
  return DEFAULT_LOCALE
}

export function useLocale() {
  const { locale } = useI18n()

  function init() {
    locale.value = resolveInitialLocale(
      window.location.search,
      window.localStorage.getItem(STORAGE_KEY)
    )
  }

  function setLocale(code: string) {
    if (!languageCodes.has(code)) return
    locale.value = code
    window.localStorage.setItem(STORAGE_KEY, code)
    const url = new URL(window.location.href)
    url.searchParams.set('lang', code)
    window.history.replaceState({}, '', url)
  }

  return { locale, init, setLocale }
}
