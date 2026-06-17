import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { languageCodes } from '@pinboard/ui'

const STORAGE_KEY = 'pcf.locale'
const DEFAULT_LOCALE = 'en'

function isValid(code: string | null): code is string {
  return !!code && languageCodes.has(code)
}

/** Resolves the initial locale: ?lang= → localStorage → browser language → default. */
export function resolveInitialLocale(
  search: string,
  stored: string | null,
  browserLanguages: readonly string[] = []
): string {
  const param = new URLSearchParams(search).get('lang')
  if (isValid(param)) return param
  if (isValid(stored)) return stored
  // Match the browser's preferred languages by primary subtag (e.g. 'zh-CN' → 'zh').
  // Our locale codes are ISO 639-1, so the primary subtag maps directly.
  for (const tag of browserLanguages) {
    const code = tag.toLowerCase().split('-')[0]
    if (isValid(code)) return code
  }
  return DEFAULT_LOCALE
}

function getBrowserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return []
  return (navigator.languages ?? [navigator.language]).filter(Boolean)
}

export function useLocale() {
  const { locale } = useI18n()
  const router = useRouter()
  const route = useRoute()

  function init() {
    locale.value = resolveInitialLocale(
      window.location.search,
      window.localStorage.getItem(STORAGE_KEY),
      getBrowserLanguages()
    )
    document.documentElement.lang = locale.value
  }

  function setLocale(code: string) {
    if (!languageCodes.has(code)) return
    locale.value = code
    document.documentElement.lang = code
    window.localStorage.setItem(STORAGE_KEY, code)
    router.replace({ query: { ...route.query, lang: code } })
  }

  return { locale, init, setLocale }
}
