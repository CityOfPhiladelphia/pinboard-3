<!-- ABOUTME: Renders supercluster-grouped map markers — cluster badges that zoom in on click,
     and individual icon-text pins for single reports. -->
<script setup lang="ts">
import { computed, toRef } from 'vue'
import { MapMarker, MapIconTextPin } from '@pinboard/ui'
import type { PinboardTypes } from '@pinboard/ui'
import { useClusters } from '@/composables/useClusters'
import { serviceTypeIconComponent } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'
import ClusterBadge from '@/components/ClusterBadge.vue'
import type { Service } from '@/types/app'

const props = defineProps<{
  locations: PinboardTypes.BasicLocation[]
  zoom: number
  map: unknown
  hoveredId: string | null
  selectedId: string | null
}>()

const emit = defineEmits<{
  hover: [id: string]
  'hover-end': []
  select: [loc: PinboardTypes.BasicLocation]
}>()

const { clusters, expansionZoom } = useClusters(toRef(props, 'locations'), toRef(props, 'zoom'))

const locationById = computed(() => {
  const m = new Map<string, PinboardTypes.BasicLocation>()
  for (const loc of props.locations) m.set(loc.id, loc)
  return m
})

function onClusterClick(item: { id: number; lng: number; lat: number }) {
  const z = expansionZoom(item.id)
  ;(props.map as { easeTo?: (o: { center: [number, number]; zoom: number }) => void })?.easeTo?.({
    center: [item.lng, item.lat],
    zoom: z,
  })
}
</script>

<template>
  <template v-for="item in clusters" :key="item.type === 'cluster' ? 'c' + item.id : item.id">
    <MapMarker v-if="item.type === 'cluster'" :lng-lat="[item.lng, item.lat]">
      <ClusterBadge :count="item.count" @click="onClusterClick(item)" />
    </MapMarker>
    <MapMarker v-else-if="locationById.get(item.id)" :lng-lat="[item.lng, item.lat]">
      <MapIconTextPin
        :zoom="zoom"
        :icon="serviceTypeIconComponent(locationById.get(item.id)?.name as Service)"
        :color="serviceTypeColor(locationById.get(item.id)?.name as Service)"
        :hovered="hoveredId === item.id"
        :selected="selectedId === item.id"
        @mouseenter="emit('hover', item.id)"
        @mouseleave="emit('hover-end')"
        @click="emit('select', locationById.get(item.id)!)"
      />
    </MapMarker>
  </template>
</template>
