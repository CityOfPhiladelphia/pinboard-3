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

export function getBrowserType() {
  let browserType: BrowserType = 'UNKNOWN'
  const userAgent = window.navigator.userAgent
  console.log(userAgent)
  for (const browser of Object.keys(browserRegex) as WebBrowser[]) {
    if (browserRegex[browser].test(userAgent)) {
      browserType = Browsers[browser]
      break
    }
  }

  return browserType
}
