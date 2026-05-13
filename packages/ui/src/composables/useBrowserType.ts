import { ref } from 'vue'
import { Browsers, type BrowserType } from '../types'

type WebBrowser = Exclude<BrowserType, 'UNKNOWN'>
const browserRegex: Record<WebBrowser, RegExp> = {
  EDGE: /edg/,
  IE: /trident/,
  FIREFOX: /firefox|fxios/,
  OPERA: /opr\//,
  UC: /ucbrowser/,
  SAMSUNG: /samsungbrowser/,
  CHROME: /chrome|chromium|crios/,
  SAFARI: /safari/,
} as const

const browserType = ref<BrowserType>('UNKNOWN')

export function useBrowserType() {
  const userAgent = window.navigator.userAgent.toLowerCase()
  for (const browser of Object.keys(browserRegex) as WebBrowser[]) {
    if (browserRegex[browser].test(userAgent)) {
      browserType.value = Browsers[browser]
      break
    }
  }

  return { browserType }
}
