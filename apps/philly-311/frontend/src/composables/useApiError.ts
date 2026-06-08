// ABOUTME: Typed error class for API responses + a parser that extracts status,
// ABOUTME: message, and Salesforce-style fieldErrors from a Response object.

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string>

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export async function parseError(r: Response): Promise<ApiError> {
  const ct = r.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    try {
      const body = await r.json()
      const message = body.error ?? body.message ?? r.statusText
      return new ApiError(r.status, message, body.fieldErrors)
    } catch {
      // fall through to text path
    }
  }
  const text = await r.text().catch(() => r.statusText)
  return new ApiError(r.status, text || r.statusText)
}
