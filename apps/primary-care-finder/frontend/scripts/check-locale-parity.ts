// Reports, per locale, keys present in en but missing elsewhere (they fall back to English).
// Run with a TypeScript-aware runner, e.g.:  npx tsx apps/primary-care-finder/frontend/scripts/check-locale-parity.ts
// This is a seam for the future automated test suite (see bead pinboard-3-kz1); it is not yet wired into CI.

import { fileURLToPath, pathToFileURL } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.resolve(__dirname, '../src/i18n')

const NON_ENGLISH_LOCALES = ['es', 'zh', 'vi', 'ru', 'fr', 'ar', 'pt', 'ht', 'sw']

/**
 * Flattens a nested object into dotted-key entries.
 * e.g. { a: { b: 'x' } } => { 'a.b': 'x' }
 */
function flatten(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const dotKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(acc, flatten(value, dotKey))
    } else {
      acc[dotKey] = value
    }
    return acc
  }, {})
}

async function loadMessages(locale) {
  const filePath = path.join(localesDir, `${locale}.ts`)
  const mod = await import(pathToFileURL(filePath).href)
  return mod.default
}

async function main() {
  const enMessages = await loadMessages('en')
  const enKeys = new Set(Object.keys(flatten(enMessages)))

  let anyMissing = false

  for (const locale of NON_ENGLISH_LOCALES) {
    const messages = await loadMessages(locale)
    const localeKeys = new Set(Object.keys(flatten(messages)))

    const missing = [...enKeys].filter((k) => !localeKeys.has(k))

    if (missing.length > 0) {
      anyMissing = true
      console.log(`\n${locale} — ${missing.length} key(s) missing:`)
      for (const key of missing.sort()) {
        console.log(`  ${key}`)
      }
    } else {
      console.log(`\n${locale} — complete (no missing keys)`)
    }
  }

  if (!anyMissing) {
    console.log('\nAll non-English locales are in parity with en.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
