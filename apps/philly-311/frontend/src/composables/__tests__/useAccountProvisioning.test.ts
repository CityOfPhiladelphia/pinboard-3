// ABOUTME: Verifies useAccountProvisioning fetches GET /private/key/me on sign-in, tracks
// ABOUTME: pending/ready/error status, and resets on sign-out.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick, effectScope, type EffectScope } from 'vue'

const authState = {
  isAuthenticated: ref(false),
  acquireToken: vi.fn(async () => 'TOKEN' as string | null),
}

vi.mock('@phila/sso-vue', () => ({
  useAuth: () => authState,
}))

import { useAccountProvisioning } from '../useAccountProvisioning'

const fetchMock = vi.fn()
global.fetch = fetchMock as unknown as typeof fetch

// The composable's watch() needs a host effectScope to be disposed by — a real
// component's setup() provides one via unmount. Stand that in for each test so
// a prior test's watcher doesn't keep reacting to authState changes.
let scope: EffectScope | null = null
function setup() {
  scope = effectScope()
  const result = scope.run(() => useAccountProvisioning())
  if (!result) throw new Error('effectScope.run() returned undefined')
  return result
}

beforeEach(() => {
  fetchMock.mockReset()
  authState.isAuthenticated.value = false
  authState.acquireToken.mockReset()
  authState.acquireToken.mockResolvedValue('TOKEN')
})

afterEach(() => {
  scope?.stop()
  scope = null
})

describe('useAccountProvisioning', () => {
  it('starts idle and makes no request when signed out', () => {
    const { status } = setup()
    expect(status.value).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('calls GET /private/key/me and becomes ready on sign-in', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: '1', name: 'A', email: 'a@b.com' })),
    )
    const { status } = setup()

    authState.isAuthenticated.value = true
    await vi.waitFor(() => expect(status.value).toBe('ready'))

    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('/private/key/me')
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer TOKEN')
  })

  it('is pending while the request is in flight', async () => {
    let resolveFetch!: (r: Response) => void
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve
      }),
    )
    const { status } = setup()

    authState.isAuthenticated.value = true
    await vi.waitFor(() => expect(status.value).toBe('pending'))

    resolveFetch(new Response(JSON.stringify({})))
    await vi.waitFor(() => expect(status.value).toBe('ready'))
  })

  it('sets status to error with the parsed API message on failure', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'No contact for a@b.com' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const { status, errorMessage } = setup()

    authState.isAuthenticated.value = true
    await vi.waitFor(() => expect(status.value).toBe('error'))
    expect(errorMessage.value).toBe('No contact for a@b.com')
  })

  it('resets to idle and clears the error on sign-out', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({})))
    const { status, errorMessage } = setup()

    authState.isAuthenticated.value = true
    await vi.waitFor(() => expect(status.value).toBe('ready'))

    authState.isAuthenticated.value = false
    await vi.waitFor(() => expect(status.value).toBe('idle'))
    expect(errorMessage.value).toBeNull()
  })

  it('retry() re-runs provisioning and can recover from an error', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'No contact for a@b.com' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({})))
    const { status, retry } = setup()

    authState.isAuthenticated.value = true
    await vi.waitFor(() => expect(status.value).toBe('error'))

    await retry()
    expect(status.value).toBe('ready')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('ignores a stale in-flight response after signing out before it resolves', async () => {
    let resolveFetch!: (r: Response) => void
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve
      }),
    )
    const { status, errorMessage } = setup()

    authState.isAuthenticated.value = true
    await vi.waitFor(() => expect(status.value).toBe('pending'))

    authState.isAuthenticated.value = false
    await nextTick()
    expect(status.value).toBe('idle')

    resolveFetch(new Response(JSON.stringify({})))
    await Promise.resolve()
    await Promise.resolve()
    expect(status.value).toBe('idle')
    expect(errorMessage.value).toBeNull()
  })
})
