export interface Language {
  code: string
  title: string
}

/** Languages supported across pinboard apps, in display order. */
export const languages: Language[] = [
  { code: 'en', title: 'English' },
  { code: 'es', title: 'Español' },
  { code: 'ch', title: '中文' },
  { code: 'vi', title: 'Tiếng Việt' },
  { code: 'ru', title: 'Русский' },
  { code: 'fr', title: 'Français' },
  { code: 'ar', title: 'عربى' },
  { code: 'pt', title: 'Português' },
  { code: 'ht', title: 'Ayisyen' },
  { code: 'sw', title: 'Kiswahili' },
]

/** Set of valid language codes, for quick validation in useLocale. */
export const languageCodes = new Set(languages.map((l) => l.code))
