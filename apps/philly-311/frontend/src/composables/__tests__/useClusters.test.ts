// ABOUTME: Tests for useClusters — cluster/single derivation at different zoom levels,
// ABOUTME: throttled re-indexing on point changes, and expansionZoom correctness.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { ref } from 'vue'
import type { PinboardTypes } from '@pinboard/ui'
import { useClusters } from '../useClusters'

afterEach(() => {
  vi.useRealTimers()
})

// Seven points packed tightly — supercluster will cluster them at low zoom.
const TIGHT_GROUP: PinboardTypes.BasicLocation[] =Array.from({ length: 7 }, (_, i) => ({
  id: `loc-${i}`,
  name: 'Pothole Repair',
  latitude: 39.95 + i * 0.0001,
  longitude: -75.16 + i * 0.0001,
}))

// Two points spread far apart — they stay as singles even at moderate zoom.
const FAR_APART: PinboardTypes.BasicLocation[] =[
  { id: 'a', name: 'Pothole Repair', latitude: 39.95, longitude: -75.16 },
  { id: 'b', name: 'Graffiti Removal', latitude: 40.7, longitude: -74.0 },
]

describe('useClusters', () => {
  it('groups a tight set into one cluster at low zoom', () => {
    const points = ref(TIGHT_GROUP)
    const zoom = ref(4)
    const { clusters } = useClusters(points, zoom)

    expect(clusters.value.length).toBe(1)
    expect(clusters.value[0].type).toBe('cluster')
    if (clusters.value[0].type === 'cluster') {
      expect(clusters.value[0].count).toBe(TIGHT_GROUP.length)
    }
  })

  it('returns singles for the same points at high zoom', () => {
    const points = ref(TIGHT_GROUP)
    const zoom = ref(18)
    const { clusters } = useClusters(points, zoom)

    expect(clusters.value.every((c) => c.type === 'single')).toBe(true)
    expect(clusters.value.length).toBe(TIGHT_GROUP.length)
  })

  it('expansionZoom is greater than the current zoom for a cluster', () => {
    const points = ref(TIGHT_GROUP)
    const zoom = ref(4)
    const { clusters, expansionZoom } = useClusters(points, zoom)

    const cluster = clusters.value.find((c) => c.type === 'cluster')
    expect(cluster).toBeDefined()
    if (cluster && cluster.type === 'cluster') {
      expect(expansionZoom(cluster.id)).toBeGreaterThan(zoom.value)
    }
  })

  it('re-derives clusters on zoom change without advancing timers', () => {
    vi.useFakeTimers()
    const points = ref(TIGHT_GROUP)
    const zoom = ref(4)
    const { clusters } = useClusters(points, zoom)

    expect(clusters.value[0].type).toBe('cluster')

    zoom.value = 18
    // No timer advancement needed — zoom change is synchronous.
    expect(clusters.value.every((c) => c.type === 'single')).toBe(true)
  })

  it('reflects new point set after changing points and advancing past throttle', async () => {
    vi.useFakeTimers()
    const points = ref(FAR_APART)
    const zoom = ref(10)
    const { clusters } = useClusters(points, zoom)

    // Initially two singles far apart.
    expect(clusters.value.length).toBe(2)
    expect(clusters.value.every((c) => c.type === 'single')).toBe(true)

    // Replace with seven tightly packed points.
    points.value = TIGHT_GROUP

    // Leading edge fires synchronously (watch callback runs sync in vitest with fakeTimers).
    // But the watcher is async by default — flush the microtask queue.
    await Promise.resolve()

    // After throttle window elapses the index is up to date.
    vi.advanceTimersByTime(500)

    // At zoom 10, the tight group should be clustered.
    expect(clusters.value.some((c) => c.type === 'cluster')).toBe(true)

    const total = clusters.value.reduce(
      (sum, c) => sum + (c.type === 'cluster' ? c.count : 1),
      0,
    )
    expect(total).toBe(TIGHT_GROUP.length)
  })
})
