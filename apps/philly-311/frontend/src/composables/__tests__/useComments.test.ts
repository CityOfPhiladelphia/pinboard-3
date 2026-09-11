// ABOUTME: Tests for useComments — GET /issues/:id/comments load and POST
// ABOUTME: /issues/:id/comments post, including the undocumented imgB64 field.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useComments } from '../useComments'
import { api311Fetch } from '../api311'

vi.mock('@phila/sso-vue', () => ({ useAuth: () => ({ isAuthenticated: { value: false } }) }))
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

const creator = { id: '005a1b2c3d4e5f6g7h', name: 'William Penn' }
const comment = {
  id: '00a1b2c3d4e5f6g7h8',
  content: 'Thanks for reporting this, we’ve dispatched a crew.',
  createdAt: '2026-05-02T09:00:00.000Z',
  updatedAt: '2026-05-02T09:00:00.000Z',
  private: false,
  creator,
}

beforeEach(() => mockFetch.mockReset())

describe('useComments - load', () => {
  it('fetches comments for the issue and exposes them', async () => {
    mockFetch.mockResolvedValueOnce(respond({ comments: [comment] }))
    const { comments, load, isLoading, errorMessage } = useComments()
    const promise = load('25012345')
    expect(isLoading.value).toBe(true)
    await promise
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/private/key/issues/25012345/comments' }),
    )
    expect(comments.value).toEqual([comment])
    expect(isLoading.value).toBe(false)
    expect(errorMessage.value).toBeNull()
  })

  it('defaults to an empty list when the response has no comments field', async () => {
    mockFetch.mockResolvedValueOnce(respond({}))
    const { comments, load } = useComments()
    await load('25012345')
    expect(comments.value).toEqual([])
  })

  it('surfaces API errors via errorMessage', async () => {
    mockFetch.mockResolvedValueOnce(respond({ error: 'not found' }, false, 404))
    const { comments, load, errorMessage } = useComments()
    await load('99999999')
    expect(comments.value).toEqual([])
    expect(errorMessage.value).toBe('not found')
  })
})

describe('useComments - post', () => {
  it('posts the content and appends the returned comment', async () => {
    mockFetch.mockResolvedValueOnce(respond(comment))
    const { comments, post, isPosting, postError } = useComments()
    const promise = post('25012345', "Any update on this? It's still blocking the lane.")
    expect(isPosting.value).toBe(true)
    const succeeded = await promise
    expect(succeeded).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/private/key/issues/25012345/comments',
        method: 'POST',
        body: { content: "Any update on this? It's still blocking the lane." },
      }),
    )
    expect(comments.value).toEqual([comment])
    expect(isPosting.value).toBe(false)
    expect(postError.value).toBeNull()
  })

  it('includes imgB64 in the request when an image is attached', async () => {
    mockFetch.mockResolvedValueOnce(respond(comment))
    const { post } = useComments()
    await post('25012345', 'See attached', 'data:image/jpeg;base64,/9j/4AAQ')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { content: 'See attached', imgB64: 'data:image/jpeg;base64,/9j/4AAQ' },
      }),
    )
  })

  it('appends to existing comments rather than replacing them', async () => {
    mockFetch.mockResolvedValueOnce(respond({ comments: [comment] }))
    const { comments, load, post } = useComments()
    await load('25012345')
    const second = { ...comment, id: 'second', content: 'A follow-up.' }
    mockFetch.mockResolvedValueOnce(respond(second))
    await post('25012345', 'A follow-up.')
    expect(comments.value).toEqual([comment, second])
  })

  it('returns false and sets postError on failure, without touching comments', async () => {
    mockFetch.mockResolvedValueOnce(respond({ error: 'boom' }, false, 400))
    const { comments, post, postError } = useComments()
    const succeeded = await post('25012345', 'Still an issue.')
    expect(succeeded).toBe(false)
    expect(postError.value).toBe('boom')
    expect(comments.value).toEqual([])
  })
})
