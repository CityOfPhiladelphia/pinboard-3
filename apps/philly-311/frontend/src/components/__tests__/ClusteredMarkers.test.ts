// ABOUTME: Tests ClusteredMarkers' pin rendering contract — pins receive the cached
// ABOUTME: icon *component* (not a raw FA definition) so mounts are warning-free and stable.
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import ClusteredMarkers from '../ClusteredMarkers.vue'
import { serviceTypeIconComponent } from '@/utils/reportIcon'

vi.mock('@pinboard/ui', () => {
  const passthrough = (name: string) =>
    defineComponent({
      name,
      setup:
        (_p, { slots }) =>
        () =>
          h('div', slots.default?.()),
    })
  return {
    MapMarker: passthrough('MapMarker'),
    MapIconTextPin: passthrough('MapIconTextPin'),
  }
})

const locations = [
  { id: 'a', name: 'Pothole Repair', latitude: 39.95, longitude: -75.16 },
  { id: 'b', name: 'Graffiti Removal', latitude: 39.85, longitude: -75.3 },
]

function mountMarkers() {
  return mount(ClusteredMarkers, {
    props: { locations, zoom: 16, map: null, hoveredId: null, selectedId: null },
  })
}

describe('ClusteredMarkers', () => {
  it('renders one pin per unclustered location', () => {
    const w = mountMarkers()
    expect(w.findAllComponents({ name: 'MapIconTextPin' })).toHaveLength(2)
  })

  it('passes the cached icon component, not a raw FA definition', () => {
    const w = mountMarkers()
    const pins = w.findAllComponents({ name: 'MapIconTextPin' })
    const pinIcons = pins.map((p) => p.vm.$attrs.icon)
    expect(pinIcons).toContain(serviceTypeIconComponent('Pothole Repair'))
    expect(pinIcons).toContain(serviceTypeIconComponent('Graffiti Removal'))
    for (const icon of pinIcons) {
      // A component (renderable), not a raw icon-definition data object.
      expect('iconName' in icon).toBe(false)
    }
  })
})
