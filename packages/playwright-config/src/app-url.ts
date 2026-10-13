export interface AppUrls {
  test: string
  prod: string
}

// Which deployed app a run targets:
//   BASE_URL=<url>        explicit override (wins)
//   TEST_ENV=test|prod    picks from the app's own URL table (default: test)
export function resolveAppUrl(urls: AppUrls): string {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL
  }

  const env = process.env.TEST_ENV ?? 'test'

  if (env !== 'test' && env !== 'prod') {
    throw new Error(`Unknown TEST_ENV "${env}" (expected "test" or "prod")`)
  }

  return urls[env]
}
