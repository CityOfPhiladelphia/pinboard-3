<script setup lang="ts">
import type { ReadingState } from '@/composables/useLocationDetail'
import type { OemLocation } from '@/types'
import { LineChart, type ChartData } from '@phila/phila-ui-charts'
import { ClientTable, type ColumnDef } from '@phila/phila-ui-table'
import { PhlTabNav, PhlTab } from '@phila/phila-ui-tabs'
import { computed, ref, type Ref } from 'vue'

const props = defineProps<{
  readingState: ReadingState
  location: OemLocation
}>()

const chartData: Ref<ChartData[]> = computed(() => {
  if (props.readingState.kind === 'Loaded' && props.readingState.data) {
    return props.readingState.data.map((reading) => ({
      x: new Date(reading.validTimeUTC).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour12: true,
      }),
      y: reading.gaugeHeight === -9999.9 ? undefined : reading.gaugeHeight,
    }))
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

// 2026-02-12T16:40:23z
</script>

<template>
  <progress v-if="readingState.kind === 'Loading'" />

  <div v-else-if="readingState.kind === 'Loaded'" class="gauge-readings">
    <div class="gauge-readings__header">
      <h6>Gauge Reading</h6>
      <PhlTabNav v-if="location.deviceType === 'Aware'" variant="primary" v-model="activeTab">
        <PhlTab id="graph" label="Graph" />
        <PhlTab id="table" label="Table" />
      </PhlTabNav>
    </div>

    <div v-show="location.deviceType !== 'Aware' || activeTab === 'graph'">
      <LineChart
        :data="chartData"
        :y-label="`Stage (${readingState.data[0]?.gaugeHeightUnit})`"
        :minimum-y-level="150"
      />
    </div>

    <div v-if="location.deviceType === 'Aware'" v-show="activeTab === 'table'">
      <ClientTable :columns="tableColumns" :data="tableData" :page-size="8" />
    </div>

    <!-- Snapshot -->
    <template v-if="location.deviceType === 'Aware' && 0 in readingState.data">
      <h6>Current Snapshot</h6>
      <img :src="location.locationCardInfo.src" />
    </template>
  </div>

  <p v-else-if="readingState.kind === 'Error'">
    {{ readingState.message }}
  </p>
</template>

<style scoped>
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
