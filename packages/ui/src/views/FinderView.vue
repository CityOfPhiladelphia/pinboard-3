<script setup lang="ts">
import { ref, nextTick, inject, type Ref } from 'vue'
import { CollapsePanel } from '@phila/phila-ui-collapse-panel'
import { PINBOARD_CONFIG_KEY, PINBOARD_SLOTS_KEY, type State } from '../types'
import SearchFilterPanel from '../components/SearchFilterPanel.vue'
import MapPanel from '../components/MapPanel.vue'

const config = inject(PINBOARD_CONFIG_KEY)!
const slots = inject(PINBOARD_SLOTS_KEY)!

const state: Ref<State> = config.useLocations()

const selectedLocation = ref<unknown | null>(null)
const returnFocusTarget = ref<HTMLElement | null>(null)

function onSelect(location: unknown, onClickOpen: () => void) {
  returnFocusTarget.value = document.activeElement as HTMLElement
  selectedLocation.value = location
  onClickOpen()
}

function onClose(onClickToggle: (e: Event) => void) {
  return (e: MouseEvent) => {
    onClickToggle(e)
    selectedLocation.value = null
    nextTick(() => returnFocusTarget.value?.focus())
  }
}
</script>

<template>
  <CollapsePanel id="detail-panel" class="detail-panel-wrapper">
    <template #toggle="{ onClickOpen }">
      <div class="finder-panel">

        <div class="finder-panel-locations">
          <SearchFilterPanel v-if="state.kind === 'Loaded'" :locations="state.data" />

          <div v-if="state.kind === 'Loading'" class="status-message">
            Loading...
          </div>

          <div v-else-if="state.kind === 'Error'" class="status-message status-message--error">
            {{ state.message }}
          </div>

          <component
            v-else-if="state.kind === 'Loaded' && slots['location-list']"
            :is="() => slots['location-list']!({
              locations: state.data,
              onSelect: (loc: unknown) => onSelect(loc, onClickOpen),
            })"
          />
        </div>

        <div class="finder-panel-map">
          <MapPanel
            v-if="state.kind === 'Loaded'"
            :config="config.map"
            :locations="state.data"
            :map-content-slot="slots['map-content']"
          />
        </div>

      </div>
    </template>

    <template #default="{ hidden, onClickToggle }">
      <div v-show="!hidden" id="detail-panel" class="detail-overlay">
        <component
          v-if="selectedLocation !== null && slots['location-detail']"
          :is="() => slots['location-detail']!({
            location: selectedLocation,
            onClose: onClose(onClickToggle),
          })"
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
