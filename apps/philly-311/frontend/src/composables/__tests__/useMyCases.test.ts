// ABOUTME: Tests for useMyCases — authed /me/issues fetch, Link pagination, Report mapping.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMyCases } from '../useMyCases'
import { api311Fetch } from '../api311'

vi.mock('../api311', () => ({ api311Fetch: vi.fn() }))
const mockFetch = vi.mocked(api311Fetch)

const issue = (n: number, extra: Record<string, unknown> = {}) => ({
  id: String(10000000 + n),
  caseNumber: String(10000000 + n),
  serviceType: 'Pothole',
  department: 'Streets',
  status: 'In Progress',
  address: `${n} Market St`,
  description: 'd',
  mediaUrl: null,
  latitude: 39.95,
  longitude: -75.16,
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-01T00:00:00Z',
  slaDate: '2026-08-01',
  slaDays: 30,
  childCount: 0,
  ...extra,
})

function respond(issues: unknown[], link: string | null) {
  return {
    ok: true,
    headers: new Headers(link ? { Link: link } : {}),
    json: async () => ({ issues }),
  } as Response
}

const auth = { isAuthenticated: { value: true } } as never

beforeEach(() => mockFetch.mockReset())

describe('useMyCases', () => {
  it('fetches /me/issues with the auth handle and maps reports incl. slaDate/department', async () => {
    mockFetch.mockResolvedValueOnce(respond([issue(1)], null))
    const cases = useMyCases(auth)
    await cases.load()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/private/key/me/issues',
        auth,
        query: expect.objectContaining({ limit: 200 }),
      }),
    )
    expect(cases.reports.value).toHaveLength(1)
    expect(cases.reports.value[0]).toMatchObject({
      id: '10000001',
      serviceType: 'Pothole',
      slaDate: '2026-08-01',
      department: 'Streets',
    })
  })

  it('follows Link next offsets until exhausted', async () => {
    mockFetch
      .mockResolvedValueOnce(respond([issue(1)], '<http://x/me/issues?offset=200>; rel="next"'))
      .mockResolvedValueOnce(respond([issue(2)], null))
    const cases = useMyCases(auth)
    await cases.load()
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch.mock.calls[1][0].query).toMatchObject({ offset: 200 })
    expect(cases.reports.value).toHaveLength(2)
  })

  it('surfaces API errors via errorMessage and clears isLoading', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers(),
      json: async () => ({}),
    } as Response)
    const cases = useMyCases(auth)
    await cases.load()
    expect(cases.errorMessage.value).toBeTruthy()
    expect(cases.isLoading.value).toBe(false)
  })

  it('leaves reports empty when a later page fails mid-pagination', async () => {
    mockFetch
      .mockResolvedValueOnce(respond([issue(1)], '<http://x/me/issues?offset=200>; rel="next"'))
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers(),
        json: async () => ({}),
      } as Response)
    const cases = useMyCases(auth)
    await cases.load()
    expect(cases.reports.value).toEqual([])
    expect(cases.errorMessage.value).toBeTruthy()
  })

  it('stops paginating when the next offset does not advance', async () => {
    mockFetch.mockResolvedValue(respond([issue(1)], '<http://x/me/issues?offset=0>; rel="next"'))
    const cases = useMyCases(auth)
    await cases.load()
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(cases.reports.value).toHaveLength(1)
  })

  it('ignores a load() while one is already in flight', async () => {
    let release!: (r: Response) => void
    mockFetch.mockImplementationOnce(() => new Promise<Response>((resolve) => (release = resolve)))
    const cases = useMyCases(auth)
    const first = cases.load()
    const second = cases.load()
    release(respond([issue(1)], null))
    await Promise.all([first, second])
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(cases.reports.value).toHaveLength(1)
  })
})
