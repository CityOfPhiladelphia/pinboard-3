// ABOUTME: Typed error class for API responses + a parser that extracts status and
// ABOUTME: message from {error: string} and Salesforce {error: {message, detail}} bodies.

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** API validation errors are `{error: string}`; Salesforce failures are `{error: {message, detail}}`. */
function errorMessage(body: { error?: unknown; message?: unknown }): string | null {
  const err = body.error
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    const { message, detail } = err as { message?: string; detail?: string }
    if (message && detail) return `${message} — ${detail}`
    return message ?? detail ?? null
  }
  return typeof body.message === 'string' ? body.message : null
}

export async function parseError(r: Response): Promise<ApiError> {
  const ct = r.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    try {
      const body = await r.json()
      return new ApiError(r.status, errorMessage(body) ?? r.statusText)
    } catch {
      // fall through to text path
    }
  }
  const text = await r.text().catch(() => r.statusText)
  return new ApiError(r.status, text || r.statusText)
}
