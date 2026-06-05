// https://developer.mozilla.org/en-US/docs/Web/API/Window/navigator

import { Browsers, type BrowserType } from '../types'

type WebBrowser = Exclude<BrowserType, 'UNKNOWN'>
const browserRegex: Record<WebBrowser, RegExp> = {
  FIREFOX: /firefox|fxios/i,
  SAMSUNG: /samsungbrowser/i,
  OPERA: /opera|opr\//i,
  EDGE: /edge?/i,
  CHROME: /chrome|chromium|crios/i,
  SAFARI: /safari/i,
} as const

export function getBrowserType(): BrowserType {
  for (const browser of Object.keys(browserRegex) as WebBrowser[]) {
    if (browserRegex[browser].test(window.navigator.userAgent)) {
      return Browsers[browser]
    }
  }
  return 'UNKNOWN'
}
