// ABOUTME: Tests for useIssue — GET /issues/:id load and POST /issues/:id/upvote,
// ABOUTME: including loading/error state and that a successful upvote replaces the issue,
// ABOUTME: recording anonymousActivity only when the caller isn't authenticated.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useIssue } from '../useIssue'
import { api311Fetch } from '../api311'
import { useAnonymousActivityStore } from '@/stores/anonymousActivity'

// A plain mutable object rather than a Vue ref — vi.hoisted runs before the
// `vue` import initializes, so `ref` itself isn't callable here yet.
const isAuthenticated = vi.hoisted(() => ({ value: false }))
vi.mock('@phila/sso-vue', () => ({ useAuth: () => ({ isAuthenticated }) }))
vi.mock('../api311', () => ({ api311Fetch: vi.fn() }))
const mockFetch = vi.mocked(api311Fetch)

function respond(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
  } as Response
}

const issue = {
  id: '25012345',
  caseNumber: '25012345',
  serviceType: 'Pothole Repair',
  status: 'New',
}

beforeEach(() => {
  mockFetch.mockReset()
  isAuthenticated.value = false
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('useIssue - load', () => {
  it('fetches the issue by id and exposes it', async () => {
    mockFetch.mockResolvedValueOnce(respond(issue))
    const { issue: result, load, isLoading, errorMessage } = useIssue()
    const promise = load('25012345')
    expect(isLoading.value).toBe(true)
    await promise
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/private/key/issues/25012345' }),
    )
    expect(result.value).toEqual(issue)
    expect(isLoading.value).toBe(false)
    expect(errorMessage.value).toBeNull()
  })

  it('surfaces API errors via errorMessage', async () => {
    mockFetch.mockResolvedValueOnce(respond({ error: 'not found' }, false, 404))
    const { issue: result, load, errorMessage } = useIssue()
    await load('99999999')
    expect(result.value).toBeNull()
    expect(errorMessage.value).toBe('not found')
  })
})

describe('useIssue - upvote', () => {
  it('posts the description and replaces the issue with the response', async () => {
    const updated = { ...issue, status: 'In Progress', childCount: 1 }
    mockFetch.mockResolvedValueOnce(respond(updated))
    const { issue: result, upvote, isUpvoting, upvoteError } = useIssue()
    const promise = upvote('25012345', 'Still there today.')
    expect(isUpvoting.value).toBe(true)
    const succeeded = await promise
    expect(succeeded).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/private/key/issues/25012345/upvote',
        method: 'POST',
        body: { description: 'Still there today.' },
      }),
    )
    expect(result.value).toEqual(updated)
    expect(isUpvoting.value).toBe(false)
    expect(upvoteError.value).toBeNull()
  })

  it('omits description from the request when blank — it is an optional field', async () => {
    const updated = { ...issue, status: 'In Progress', childCount: 1 }
    mockFetch.mockResolvedValueOnce(respond(updated))
    const { upvote } = useIssue()
    await upvote('25012345', '   ')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/private/key/issues/25012345/upvote',
        method: 'POST',
        body: {},
      }),
    )
  })

  it('returns false and sets upvoteError on failure, without touching issue', async () => {
    mockFetch.mockResolvedValueOnce(respond({ error: 'Cannot upvote your own issue' }, false, 400))
    const { issue: result, upvote, upvoteError } = useIssue()
    const succeeded = await upvote('25012345', 'Still there today.')
    expect(succeeded).toBe(false)
    expect(upvoteError.value).toBe('Cannot upvote your own issue')
    expect(result.value).toBeNull()
  })

  it('records the upvote in anonymousActivity when not authenticated — the API has no account to dedupe it', async () => {
    mockFetch.mockResolvedValueOnce(respond(issue))
    const { upvote } = useIssue()
    await upvote('25012345', 'Still there today.')
    expect(useAnonymousActivityStore().isUpvoted('25012345')).toBe(true)
  })

  it('does not record to anonymousActivity when authenticated — the server tracks it instead', async () => {
    isAuthenticated.value = true
    mockFetch.mockResolvedValueOnce(respond(issue))
    const { upvote } = useIssue()
    await upvote('25012345', 'Still there today.')
    expect(useAnonymousActivityStore().isUpvoted('25012345')).toBe(false)
  })

  it('does not record to anonymousActivity on failure', async () => {
    mockFetch.mockResolvedValueOnce(respond({ error: 'boom' }, false, 400))
    const { upvote } = useIssue()
    await upvote('25012345', 'Still there today.')
    expect(useAnonymousActivityStore().isUpvoted('25012345')).toBe(false)
  })
})
