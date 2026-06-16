// ABOUTME: Tests for the useDebouncedSearch composable — debounce, abort,
// ABOUTME: empty-query branch, error surface, unmount cleanup.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useDebouncedSearch } from '../useDebouncedSearch'

function harness<T>(setup: () => ReturnType<typeof useDebouncedSearch<T>>) {
  const Comp = defineComponent({
    setup,
    render: () => h('div'),
  })
  return mount(Comp)
}

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces fetch by the configured delay', async () => {
    const fetcher = vi.fn(async (q: string) => [`hit:${q}`])
    let api!: ReturnType<typeof useDebouncedSearch<string[]>>
    harness(() => {
      api = useDebouncedSearch<string[]>({
        initial: [],
        delay: 200,
        fetcher,
      })
      return {}
    })

    api.query.value = 'po'
    api.query.value = 'pot'
    api.query.value = 'pothole'
    await nextTick()

    expect(fetcher).not.toHaveBeenCalled()
    vi.advanceTimersByTime(199)
    await nextTick()
    expect(fetcher).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    await nextTick()
    await Promise.resolve()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith('pothole', expect.any(AbortSignal))
  })

  it('drops the result of an aborted in-flight fetch', async () => {
    let resolveFirst!: (v: string[]) => void
    const fetcher = vi.fn((q: string, _signal: AbortSignal): Promise<string[]> => {
      if (q === 'a')
        return new Promise((r) => {
          resolveFirst = r
        })
      return Promise.resolve([`hit:${q}`])
    })
    let api!: ReturnType<typeof useDebouncedSearch<string[]>>
    harness(() => {
      api = useDebouncedSearch<string[]>({ initial: [], delay: 50, fetcher })
      return {}
    })

    api.query.value = 'a'
    await nextTick()
    vi.advanceTimersByTime(50)
    await nextTick()
    // First fetch is in flight. Type a new query before it resolves.
    api.query.value = 'b'
    await nextTick()
    vi.advanceTimersByTime(50)
    await nextTick()
    await Promise.resolve()

    // Now the first fetch resolves — its result must NOT land.
    resolveFirst(['stale'])
    await Promise.resolve()
    await Promise.resolve()

    expect(api.results.value).toEqual(['hit:b'])
  })

  it('clears results when query becomes empty', async () => {
    const fetcher = vi.fn(async (q: string) => [`hit:${q}`])
    let api!: ReturnType<typeof useDebouncedSearch<string[]>>
    harness(() => {
      api = useDebouncedSearch<string[]>({ initial: [], delay: 100, fetcher })
      return {}
    })

    api.query.value = 'foo'
    await nextTick()
    vi.advanceTimersByTime(100)
    await nextTick()
    await Promise.resolve()
    expect(api.results.value).toEqual(['hit:foo'])

    api.query.value = '   '
    await nextTick()
    await Promise.resolve()
    expect(api.results.value).toEqual([])
    expect(api.loading.value).toBe(false)
  })

  it('runs onEmpty when query is empty', async () => {
    const onEmpty = vi.fn(async () => ['default'])
    let api!: ReturnType<typeof useDebouncedSearch<string[]>>
    harness(() => {
      api = useDebouncedSearch<string[]>({
        initial: [],
        delay: 50,
        fetcher: async () => ['shouldnt-run'],
        onEmpty,
      })
      return {}
    })

    // Move off empty first so the empty→empty transition is observable.
    api.query.value = 'x'
    await nextTick()
    api.query.value = ''
    await nextTick()
    await Promise.resolve()
    expect(onEmpty).toHaveBeenCalled()
    expect(api.results.value).toEqual(['default'])
  })

  it('surfaces fetcher errors via the error ref', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('boom')
    })
    let api!: ReturnType<typeof useDebouncedSearch<string[]>>
    harness(() => {
      api = useDebouncedSearch<string[]>({ initial: [], delay: 10, fetcher })
      return {}
    })

    api.query.value = 'x'
    await nextTick()
    vi.advanceTimersByTime(10)
    await nextTick()
    await Promise.resolve()
    await Promise.resolve()
    expect(api.error.value).toBe('boom')
    expect(api.loading.value).toBe(false)
  })

  it('swallows AbortError thrown by the fetcher', async () => {
    const fetcher = vi.fn(async () => {
      const e = new Error('aborted')
      e.name = 'AbortError'
      throw e
    })
    let api!: ReturnType<typeof useDebouncedSearch<string[]>>
    harness(() => {
      api = useDebouncedSearch<string[]>({ initial: [], delay: 10, fetcher })
      return {}
    })

    api.query.value = 'x'
    await nextTick()
    vi.advanceTimersByTime(10)
    await nextTick()
    await Promise.resolve()
    await Promise.resolve()
    expect(api.error.value).toBeNull()
  })

  it('cancels pending timer + in-flight on unmount', async () => {
    let signal!: AbortSignal
    const fetcher = vi.fn(async (_q: string, s: AbortSignal) => {
      signal = s
      return new Promise<string[]>((r) => setTimeout(() => r(['done']), 1000))
    })
    let api!: ReturnType<typeof useDebouncedSearch<string[]>>
    const wrapper = harness(() => {
      api = useDebouncedSearch<string[]>({ initial: [], delay: 50, fetcher })
      return {}
    })

    api.query.value = 'foo'
    await nextTick()
    vi.advanceTimersByTime(50)
    await nextTick()
    await Promise.resolve()
    expect(signal.aborted).toBe(false)
    wrapper.unmount()
    expect(signal.aborted).toBe(true)
  })

  it('toggles loading around the fetcher', async () => {
    let resolveFetch!: (v: string[]) => void
    const fetcher = vi.fn(
      () =>
        new Promise<string[]>((r) => {
          resolveFetch = r
        }),
    )
    let api!: ReturnType<typeof useDebouncedSearch<string[]>>
    harness(() => {
      api = useDebouncedSearch<string[]>({ initial: [], delay: 10, fetcher })
      return {}
    })

    api.query.value = 'q'
    await nextTick()
    expect(api.loading.value).toBe(true)
    vi.advanceTimersByTime(10)
    await nextTick()
    expect(api.loading.value).toBe(true)
    resolveFetch(['ok'])
    await Promise.resolve()
    await Promise.resolve()
    expect(api.loading.value).toBe(false)
  })
})
