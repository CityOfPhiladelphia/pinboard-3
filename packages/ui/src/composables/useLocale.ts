import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { languageCodes } from '../i18n'

const DEFAULT_LOCALE = 'en'

function isValid(code: string | null): code is string {
  return !!code && languageCodes.has(code)
}

/** Resolves the initial locale: ?lang= → localStorage → browser language → default. */
function resolveInitialLocale(
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

export function useLocale(appKey: string) {
  const STORAGE_KEY = `${appKey}.locale`
  const { locale } = useI18n()
  const router = useRouter()
  const route = useRoute()

  // Keep ?lang in the URL canonical: present for a non-default language, absent for
  // the default (English). No-ops when the URL already matches, and the syncing guard
  // stops the router.afterEach hook below from re-triggering this replace while its own
  // navigation is still settling — otherwise afterEach → replace → afterEach recurses
  // faster than the route can commit and the main thread locks up.
  let syncing = false
  function syncLangQuery(code: string) {
    if (syncing) return
    const desired = code === DEFAULT_LOCALE ? undefined : code
    if (route.query.lang === desired) return
    const query = { ...route.query }
    if (desired === undefined) delete query.lang
    else query.lang = desired
    syncing = true
    router.replace({ query }).finally(() => {
      syncing = false
    })
  }

  function init() {
    const resolved = resolveInitialLocale(
      window.location.search,
      window.localStorage.getItem(STORAGE_KEY),
      getBrowserLanguages()
    )
    locale.value = resolved
    document.documentElement.lang = resolved
    // Reflect the resolved language in the URL once the router's initial navigation
    // settles — so a localStorage/browser-resolved language is visible and shareable,
    // not just an explicit switch.
    router.isReady().then(() => syncLangQuery(resolved))
  }

  function setLocale(code: string) {
    if (!languageCodes.has(code)) return
    locale.value = code
    document.documentElement.lang = code
    window.localStorage.setItem(STORAGE_KEY, code)
    syncLangQuery(code)
  }

  // Re-stamp the active language onto every URL the user navigates to — including history entries
  // created before the language was chosen — so Back/Forward never strip ?lang. Language is a
  // sticky setting, not a back-able step; this keeps the URL consistent without adding history.
  router.afterEach(() => syncLangQuery(locale.value))

  return { locale, init, setLocale }
}
