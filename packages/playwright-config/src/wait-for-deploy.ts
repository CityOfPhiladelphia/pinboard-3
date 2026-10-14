import { USER_AGENT } from './user-agent'

const POLL_INTERVAL = 5000

// Same identity as the browser, so this check sees what the tests will see.
const REQUEST_HEADERS = { 'user-agent': USER_AGENT }

// Response headers that say where a response came from and whether CloudFront
// served it or replaced it with the SPA fallback ("Error from cloudfront").
const EVIDENCE_HEADERS = [
  'x-cache',
  'age',
  'server',
  'content-type',
  'content-length',
  'last-modified',
  'x-amz-cf-pop',
  'x-amz-cf-id',
  'via',
]

function describe(label: string, response: Response) {
  const headers = EVIDENCE_HEADERS.flatMap((name) => {
    const value = response.headers.get(name)
    return value ? [`${name}: ${value}`] : []
  })
  return [`${label} -> HTTP ${response.status}`, ...headers.map((h) => `    ${h}`)].join('\n')
}

// The runner's public IP, so a block by IP can be reported and allow-listed.
async function egressIp() {
  try {
    const response = await fetch('https://api.ipify.org', { signal: AbortSignal.timeout(5000) })
    return (await response.text()).trim()
  } catch {
    return 'unknown'
  }
}

// Post-deploy, the new index.html can be served before its hashed bundle is
// (upload ordering, CloudFront invalidation, or a cached SPA-fallback response
// for the not-yet-uploaded asset). The browser then gets text/html for the
// script and the app never mounts. Wait until the bundle the page points at is
// actually served as JavaScript, so a problem reads as a clear deploy or
// network issue rather than a mysterious blank page.
export async function waitForDeployment(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs
  let lastProblem = 'no attempt made'
  let evidence: string[] = []

  for (;;) {
    try {
      const page = await fetch(url, {
        headers: REQUEST_HEADERS,
        signal: AbortSignal.timeout(15000),
      })
      const html = await page.text()
      const src = html.match(/<script[^>]*\ssrc="([^"]+\.js)"/)?.[1]
      evidence = [describe(`GET ${url}`, page)]

      if (!page.ok) {
        lastProblem = `${url} returned HTTP ${page.status}`
      } else if (!src) {
        lastProblem = `no <script src="...js"> found in ${url}`
      } else {
        const assetUrl = new URL(src, url).toString()
        const asset = await fetch(assetUrl, {
          headers: REQUEST_HEADERS,
          signal: AbortSignal.timeout(15000),
        })
        const type = asset.headers.get('content-type') ?? ''
        evidence.push(describe(`GET ${assetUrl}`, asset))

        if (asset.ok && /javascript/i.test(type)) {
          return
        }
        lastProblem = `${assetUrl} returned HTTP ${asset.status} as "${type}" (expected JavaScript)`
      }
    } catch (error) {
      lastProblem = `request failed: ${error instanceof Error ? error.message : String(error)}`
    }

    if (Date.now() + POLL_INTERVAL > deadline) {
      throw new Error(
        [
          `Deployment at ${url} was not serving its bundle after ${Math.round(timeoutMs / 1000)}s: ${lastProblem}`,
          `Runner egress IP: ${await egressIp()}`,
          `User-Agent: ${USER_AGENT}`,
          ...evidence,
          'Note: "x-cache: Error from cloudfront" means CloudFront replaced the response with ' +
            'the SPA fallback, i.e. the origin or WAF answered 403/404 for this client.',
        ].join('\n')
      )
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
  }
}
