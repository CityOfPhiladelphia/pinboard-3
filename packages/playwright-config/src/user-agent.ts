// Headless Chromium identifies itself as "HeadlessChrome", which bot-control
// rules commonly flag. Smoke tests present as regular desktop Chrome plus a
// product token, so WAF admins can recognise (and allow-list) this traffic.
//
// Override with SMOKE_USER_AGENT to experiment without a code change.
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/140.0.0.0 Safari/537.36 PinboardSmokeTest/1.0'

export const USER_AGENT = process.env.SMOKE_USER_AGENT || DEFAULT_USER_AGENT
