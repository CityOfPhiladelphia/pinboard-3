<script setup lang="ts">
import type { OemLocation, ReadingState } from '@/types'
import { LineChart, type ChartData } from '@phila/phila-ui-charts'
import { ClientTable, type ColumnDef } from '@phila/phila-ui-table'
import { PhlTabNav, PhlTab } from '@phila/phila-ui-tabs'
import { computed, ref, type Ref } from 'vue'
import { Icon } from '@phila/phila-ui-core'
import {
  IconGauge,
  IconCloudRain,
  IconDroplet,
  IconCloudShowersHeavy,
  IconTemperatureFull,
} from '@phila/phila-ui-core/icons'
import { PinboardComposables } from '@pinboard/ui'

const props = defineProps<{
  readingState: ReadingState
  location: OemLocation
}>()

const isMobile = PinboardComposables.useIsMobile()

const chartData: Ref<ChartData[]> = computed(() => {
  if (props.readingState.kind === 'Loaded' && props.readingState.data) {
    const offset = new Date().getTimezoneOffset() * 60 * 1000
    return props.readingState.data
      .map((reading) => {
        const x = new Date(new Date(reading.validTimeUTC).getTime() - offset).toString()
        const y = reading.gaugeHeight === -9999.9 ? undefined : reading.gaugeHeight
        return { x, y }
      })
      .reverse()
  }
  return []
})

const activeTab = ref('graph')

const tableColumns: ColumnDef[] = [
  {
    headerLabel: 'Height',
    key: 'gaugeHeight',
    format: (value) => ((value as number) === -9999.9 ? 'No data' : `${value} in`),
  },
  {
    headerLabel: 'Time',
    key: 'validTimeUTC',
    format: (value) => {
      const date = new Date(value as string)
      const datePart = date.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
      })
      const timePart = date.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      return `${datePart} - ${timePart}`
    },
  },
]

const tableData = computed((): Record<string, unknown>[] => {
  if (props.readingState.kind !== 'Loaded') return []
  return props.readingState.data as unknown as Record<string, unknown>[]
})

const snapshotTimestamp = computed(() => {
  const timestamp = props.location.pictureTimestampUTC

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(timestamp ?? undefined)
})

// 2026-02-12T16:40:23z
</script>

<template>
  <progress v-if="readingState.kind === 'Loading'" />

  <div v-else-if="readingState.kind === 'Loaded'" class="gauge-readings">
    <div class="gauge-readings__header">
      <div class="has-text-label-default">Gauge Reading</div>
      <PhlTabNav v-if="location.deviceType === 'Aware'" v-model="activeTab" variant="primary">
        <PhlTab id="graph" label="Graph" />
        <PhlTab id="table" label="Table" />
      </PhlTabNav>
    </div>

    <div v-show="location.deviceType !== 'Aware' || activeTab === 'graph'">
      <LineChart :data="chartData" :y-label="`Stage (in)`" :disable-scroll-zoom="isMobile" />
    </div>

    <div v-if="location.deviceType === 'Aware'" v-show="activeTab === 'table'">
      <ClientTable :columns="tableColumns" :data="tableData" :page-size="8" />
    </div>
    <div v-if="readingState.gaugeType === 'Aware'" style="padding: var(--spacing-xxl) 0 0 0">
      <div style="font-weight: bold">Weather details</div>
      <div class="weather-details">
        <div>
          <Icon :icon="IconCloudRain" size="extra-small" />
          <div style="margin-left: var(--spacing-s)">
            <div class="has-text-label-small" style="color: #666">Rainfall</div>
            <div class="has-text-body-small">{{ readingState.data[0].rainfall }} in</div>
          </div>
        </div>

        <div>
          <Icon :icon="IconDroplet" size="extra-small" />
          <div style="margin-left: var(--spacing-s)">
            <div class="has-text-label-small" style="color: #666">Water Temperature</div>
            <div class="has-text-body-small">
              {{
                readingState.data[0].waterTemperature === -9999.9
                  ? 'No data'
                  : `${Math.round((readingState.data[0].waterTemperature * 9) / 5 + 32)} \u00B0F`
              }}
            </div>
          </div>
        </div>

        <div>
          <Icon :icon="IconCloudShowersHeavy" size="extra-small" />
          <div style="margin-left: var(--spacing-s)">
            <div class="has-text-label-small" style="color: #666">Rain Intensity</div>
            <div class="has-text-body-small">{{ readingState.data[0].rainIntensity }} in/hr</div>
          </div>
        </div>

        <div>
          <Icon :icon="IconTemperatureFull" size="extra-small" />
          <div style="margin-left: var(--spacing-s)">
            <div class="has-text-label-small" style="color: #666">Air Temperature</div>
            <div class="has-text-body-small">
              {{
                readingState.data[0].airTemperature === -9999.9
                  ? 'No data'
                  : `${Math.round((readingState.data[0].airTemperature * 9) / 5 + 32)} \u00B0F`
              }}
            </div>
          </div>
        </div>

        <div>
          <Icon :icon="IconGauge" size="extra-small" />
          <div style="margin-left: var(--spacing-s)">
            <div class="has-text-label-small" style="color: #666">Barometric Pressure</div>
            <div class="has-text-body-small">
              {{
                readingState.data[0].barometricPressure === -9999.9
                  ? 'No data'
                  : readingState.data[0].barometricPressure
              }}
              mbar
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Snapshot -->
    <template v-if="location.deviceType === 'Aware' && 0 in readingState.data">
      <h6 style="padding: var(--spacing-xxl) 0 0 0">Current Snapshot</h6>
      <img style="padding: 1rem 0 0 0" :src="location.locationCardInfo.src" width="400px" />
      <div class="has-text-body-extra-small">Timestamp: {{ snapshotTimestamp }}</div>
    </template>
  </div>

  <p v-else-if="readingState.kind === 'Error'">
    {{ readingState.message }}
  </p>
</template>

<style scoped>
.weather-details {
  display: grid;
  grid-template-columns: auto auto;
}

.weather-details > div {
  text-align: left;
  display: flex;
  margin: var(--spacing-m) 0 0 0;
}

.gauge-readings__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-m);
}

.gauge-readings__header :deep(.phila-tab-nav__list) {
  padding: var(--spacing-3xs);
  gap: var(--spacing-3xs);
  border-radius: var(--border-radius-xs);
}

.gauge-readings__header :deep(.phila-tab) {
  padding: var(--spacing-2xs);
  min-height: unset;
  border-radius: var(--border-radius-xs);
}

.gauge-readings__header :deep(.phila-tab__label) {
  font-family: var(--Body-ExtraSmall-font-body-xs-family);
  font-size: var(--Body-ExtraSmall-font-body-xs-size);
  font-weight: var(--Body-ExtraSmall-font-body-xs-weight);
  line-height: var(--Body-ExtraSmall-font-body-xs-lineheight);
}
</style>
