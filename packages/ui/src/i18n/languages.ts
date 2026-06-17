export interface Language {
  code: string
  title: string
  /** BCP-47 tag for the `lang` attribute (pronunciation). `code` is the i18n key, not always a valid tag. */
  lang?: string
}

/** Languages supported across pinboard apps, in display order. */
export const languages: Language[] = [
  { code: 'en', title: 'English', lang: 'en' },
  { code: 'es', title: 'Español', lang: 'es' },
  { code: 'zh', title: '中文', lang: 'zh' },
  { code: 'vi', title: 'Tiếng Việt', lang: 'vi' },
  { code: 'ru', title: 'Русский', lang: 'ru' },
  { code: 'fr', title: 'Français', lang: 'fr' },
  { code: 'ar', title: 'عربى', lang: 'ar' },
  { code: 'pt', title: 'Português', lang: 'pt' },
  { code: 'ht', title: 'Ayisyen', lang: 'ht' },
  { code: 'sw', title: 'Kiswahili', lang: 'sw' },
]

/** Set of valid language codes, for quick validation in useLocale. */
export const languageCodes = new Set(languages.map((l) => l.code))
