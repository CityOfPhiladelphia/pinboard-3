// ABOUTME: Verifies ApiError carries status and message.
// ABOUTME: Verifies parseError handles string and Salesforce object error shapes.
import { describe, expect, it } from 'vitest'
import { ApiError, parseError } from './useApiError'

describe('ApiError', () => {
  it('exposes status and message', () => {
    const e = new ApiError(400, 'Validation failed')
    expect(e.status).toBe(400)
    expect(e.message).toBe('Validation failed')
    expect(e.name).toBe('ApiError')
    expect(e instanceof Error).toBe(true)
  })
})

describe('parseError', () => {
  it('parses string errors ({error: string})', async () => {
    const r = new Response(JSON.stringify({ error: 'serviceRequestType is required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
    const e = await parseError(r)
    expect(e.status).toBe(400)
    expect(e.message).toBe('serviceRequestType is required')
  })

  it('parses Salesforce object errors ({error: {message, detail}}), joining detail', async () => {
    const r = new Response(
      JSON.stringify({
        error: { message: 'Salesforce error', detail: 'Required fields are missing: [Street__c]' },
      }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    )
    const e = await parseError(r)
    expect(e.message).toBe('Salesforce error — Required fields are missing: [Street__c]')
  })

  it('uses message alone when the object error has no detail', async () => {
    const r = new Response(JSON.stringify({ error: { message: 'Salesforce error' } }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    })
    const e = await parseError(r)
    expect(e.message).toBe('Salesforce error')
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
