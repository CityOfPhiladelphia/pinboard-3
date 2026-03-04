<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { Location } from '../types'
import SearchFilterPane from '../components/SearchFilterPane.vue'
import LocationList from '../components/LocationList.vue'
import MapPane from '../components/MapPane.vue'
import { CollapsePanel } from '@phila/phila-ui-collapse-panel'
import LocationDetail from '../components/LocationDetail.vue'
import { useLocations } from '../composables/useLocations'

const { locations, isLoading, error } = useLocations()
const selectedLocation = ref<Location | null>(null)
const locationDetail = ref<InstanceType<typeof LocationDetail> | null>(null)
const returnFocusTarget = ref<HTMLElement | null>(null)

function openDetail(loc: Location, onClickOpen: () => void) {
  returnFocusTarget.value = document.activeElement as HTMLElement
  selectedLocation.value = loc
  onClickOpen()
  nextTick(() => locationDetail.value?.focus())
}

function closeDetail(onClickToggle: (e: Event) => void) {
  return (e: MouseEvent) => {
    onClickToggle(e)
    nextTick(() => returnFocusTarget.value?.focus())
  }
}
</script>

<template>
  <CollapsePanel id="detail-panel" class="detail-panel-wrapper">
    <template #toggle="{ onClickOpen }">
      <div class="finder-panel">
        <div class="finder-panel-locations">
          <SearchFilterPane :locations="locations" />
          <div v-if="isLoading" class="status-message">Loading...</div>
          <div v-else-if="error" class="status-message status-message--error">
            {{ error.message }}
          </div>
          <LocationList
            v-else
            :locations="locations"
            @card-click="(loc) => openDetail(loc, onClickOpen)"
          />
        </div>
        <div class="finder-panel-map">
          <MapPane :locations="locations" />
        </div>
      </div>
    </template>

    <template #default="{ hidden, onClickToggle }">
      <div v-show="!hidden" id="detail-panel" class="detail-overlay">
        <LocationDetail
          ref="locationDetail"
          :location="selectedLocation"
          :on-close="closeDetail(onClickToggle)"
        />
      </div>
    </template>
  </CollapsePanel>
</template>

<style scoped>
.detail-panel-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.finder-panel {
  display: flex;
  width: 100%;
  height: 100%;
}

.finder-panel-locations {
  display: flex;
  flex-direction: column;
  width: 25%;
  border-right: 1px solid #ccc;
  overflow: hidden;
}

.status-message {
  padding: 1rem;
  color: var(--Schemes-On-Surface, #333);
}

.status-message--error {
  color: var(--Schemes-Error, #b3261e);
}

.finder-panel-locations > :deep(.location-list) {
  flex: 1;
  overflow-y: auto;
}

.finder-panel-map {
  width: 75%;
  overflow: hidden;
}

.detail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 33%;
  z-index: 10;
  background: var(--Schemes-Surface-Bright, white);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
