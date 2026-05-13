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

export function getBrowserType() {
  let browserType: BrowserType = 'UNKNOWN'
  const userAgent = window.navigator.userAgent.toLowerCase()
  for (const browser of Object.keys(browserRegex) as WebBrowser[]) {
    if (browserRegex[browser].test(userAgent)) {
      browserType = Browsers[browser]
      break
    }
  }

  return browserType
}
