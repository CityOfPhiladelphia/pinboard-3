// ABOUTME: Tests for ReportsPage — stat-tile counts from bucketed cases, Pinboard
// ABOUTME: wiring (locations, cards, detail with case fields), and the empty state.
import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount, RouterLinkStub } from '@vue/test-utils'
import ReportsPage from '../ReportsPage.vue'
import type { Report } from '@/composables/useNearbyReports'

const reports = ref<Report[]>([])
const errorMessage = ref<string | null>(null)
const load = vi.fn()
vi.mock('@/composables/useMyCases', () => ({
  useMyCases: () => ({ reports, isLoading: ref(false), errorMessage, load }),
}))
vi.mock('@phila/sso-vue', () => ({ useAuth: () => ({ isAuthenticated: ref(true) }) }))
vi.mock('@pinboard/ui', async () => ({
  Pinboard: defineComponent({
    name: 'Pinboard',
    props: { locations: { type: Array, default: () => [] } },
    setup(props, { slots }) {
      return () =>
        h('div', [
          h('div', { 'data-test': 'page-header' }, slots['page-header']?.()),
          h('div', { 'data-test': 'locations-header' }, slots['locations-header']?.()),
          h(
            'div',
            { 'data-test': 'cards' },
            (props.locations as { id: string }[]).map((l) =>
              slots['location-card']?.({ location: l }),
            ),
          ),
        ])
    },
  }),
  MapNavigationControl: { template: '<div />' },
  BasemapToggle: { template: '<div />' },
  PinboardComposables: { useIsMobile: () => ref(false) },
}))

const rpt = (id: string, status: string): Report => ({
  id,
  lat: 39.95,
  lng: -75.16,
  serviceType: 'Pothole',
  status,
  address: `${id} St`,
  createdAt: '2026-07-01T00:00:00Z',
})

function mountPage() {
  return mount(ReportsPage, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        ClusteredMarkers: true,
        MapConstraints: true,
        ReportDetail: true,
      },
    },
  })
}

describe('ReportsPage', () => {
  it('loads cases on mount and buckets them into the four stat tiles', () => {
    reports.value = [
      rpt('1', 'Resolved'),
      rpt('2', 'Closed'),
      rpt('3', 'New'),
      rpt('4', 'In Progress'),
    ]
    const w = mountPage()
    expect(load).toHaveBeenCalled()
    const tiles = w.findAllComponents({ name: 'StatTile' })
    expect(tiles.map((t) => [t.props('label'), t.props('value')])).toEqual([
      ['Total', 4],
      ['Resolved', 1],
      ['In Progress', 2],
      ['Closed', 1],
    ])
  })

  it('passes one location per case to Pinboard and renders listing cards', () => {
    reports.value = [rpt('1', 'New'), rpt('2', 'New')]
    const w = mountPage()
    const cards = w.find('[data-test="cards"]').findAllComponents({ name: 'ReportListingCard' })
    expect(cards).toHaveLength(2)
  })

  it('shows the empty state with a link to /report when there are no cases', () => {
    reports.value = []
    errorMessage.value = null
    const w = mountPage()
    expect(w.text()).toContain("You haven't submitted any requests yet")
    const link = w.findComponent(RouterLinkStub)
    expect(link.props('to')).toBe('/report')
  })

  it('does not show the empty state when the load failed', () => {
    reports.value = []
    errorMessage.value = 'Something went wrong'
    const w = mountPage()
    expect(w.text()).not.toContain("You haven't submitted any requests yet")
    errorMessage.value = null
  })
})
