const POLL_INTERVAL = 5000

// Post-deploy, the new index.html can be served before its hashed bundle is
// (upload ordering, CloudFront invalidation, or a cached SPA-fallback response
// for the not-yet-uploaded asset). The browser then gets text/html for the
// script and the app never mounts. Wait until the bundle the page points at is
// actually served as JavaScript, so a race reads as a clear deploy problem
// rather than a mysterious blank page.
export async function waitForDeployment(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs
  let lastProblem = 'no attempt made'

  for (;;) {
    try {
      const page = await fetch(url, { signal: AbortSignal.timeout(15000) })
      const html = await page.text()
      const src = html.match(/<script[^>]*\ssrc="([^"]+\.js)"/)?.[1]

      if (!page.ok) {
        lastProblem = `${url} returned HTTP ${page.status}`
      } else if (!src) {
        lastProblem = `no <script src="...js"> found in ${url}`
      } else {
        const assetUrl = new URL(src, url).toString()
        const asset = await fetch(assetUrl, { signal: AbortSignal.timeout(15000) })
        const type = asset.headers.get('content-type') ?? ''

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
        `Deployment at ${url} was not serving its bundle after ${Math.round(timeoutMs / 1000)}s: ${lastProblem}`
      )
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
  }
}
