// ABOUTME: Verifies ApiError carries status, message, and Salesforce-style fieldErrors.
// ABOUTME: Verifies parseError extracts the fields from JSON / falls back on non-JSON.
import { describe, expect, it } from 'vitest'
import { ApiError, parseError } from './useApiError'

describe('ApiError', () => {
  it('exposes status, message, and fieldErrors', () => {
    const e = new ApiError(400, 'Validation failed', { Service_Request_Type__c: 'invalid' })
    expect(e.status).toBe(400)
    expect(e.message).toBe('Validation failed')
    expect(e.fieldErrors?.Service_Request_Type__c).toBe('invalid')
    expect(e.name).toBe('ApiError')
    expect(e instanceof Error).toBe(true)
  })

  it('omits fieldErrors when not provided', () => {
    const e = new ApiError(500, 'boom')
    expect(e.fieldErrors).toBeUndefined()
  })
})

describe('parseError', () => {
  it('parses Salesforce-style JSON errors with fieldErrors', async () => {
    const r = new Response(
      JSON.stringify({ error: 'Validation failed', fieldErrors: { Description: 'Required' } }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    )
    const e = await parseError(r)
    expect(e.status).toBe(400)
    expect(e.message).toBe('Validation failed')
    expect(e.fieldErrors?.Description).toBe('Required')
  })

  it('falls back to body.message when body.error is missing', async () => {
    const r = new Response(JSON.stringify({ message: 'something went wrong' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
    const e = await parseError(r)
    expect(e.message).toBe('something went wrong')
  })

  it('uses statusText when both error and message are missing', async () => {
    const r = new Response(JSON.stringify({ irrelevant: 'data' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'content-type': 'application/json' },
    })
    const e = await parseError(r)
    expect(e.message).toBe('Service Unavailable')
  })

  it('reads non-JSON responses as plain text', async () => {
    const r = new Response('Bad gateway plain text', { status: 502 })
    const e = await parseError(r)
    expect(e.status).toBe(502)
    expect(e.message).toBe('Bad gateway plain text')
  })

  it('falls back to statusText when text() is unreadable', async () => {
    // Construct a Response, pre-consume the body to make .text() reject.
    const r = new Response('payload', { status: 504, statusText: 'Gateway Timeout' })
    await r.text() // body now consumed
    const e = await parseError(r)
    expect(e.message).toBe('Gateway Timeout')
  })
})
