<script setup lang="ts">
import { computed } from 'vue'
import { Tags, Tooltip } from '@pinboard/ui'
import type { TagColor } from '@phila/phila-ui-tags'
import type { IconComponent } from '@phila/phila-ui-core'
import {
  IconCar,
  IconSuitcaseMedical,
  IconVideo,
  IconPersonWalking,
  IconPerson,
  IconClock,
  IconLanguage,
} from '@phila/phila-ui-core/icons'
import type { PrimaryCareLocation } from '@/types'

const props = defineProps<{
  location: PrimaryCareLocation
  max?: number
  detail?: boolean
}>()

const p = computed(() => props.location.properties)

const YES_VALUES = ['Yes', 'Established Patients']

const DAYS = ['sun', 'mon', 'tues', 'wed', 'thurs', 'fri', 'sat'] as const

interface TagConfig {
  text: string
  color: TagColor
  icon: IconComponent
  tooltip?: string
}

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(':')
  let h = parseInt(hStr)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return mStr === '00' ? `${h}\u00A0${ampm}` : `${h}:${mStr}\u00A0${ampm}`
}

const todaysHoursTooltip = computed<string>(() => {
  const dayKey = DAYS[new Date().getDay()]
  const start = p.value[`hours_${dayKey}_start`] as string | null
  const end = p.value[`hours_${dayKey}_end`] as string | null
  if (!start || !end) return 'Today: Closed'
  return `Today:\u00A0${formatTime(start)}\u00A0–\u00A0${formatTime(end)}`
})

const hoursStatus = computed<'openNow' | 'closed' | 'checkHours'>(() => {
  const now = new Date()
  const dayKey = DAYS[now.getDay()]
  const start = p.value[`hours_${dayKey}_start`] as string | null
  const end = p.value[`hours_${dayKey}_end`] as string | null
  const exceptions = p.value[`hours_${dayKey}_exceptions`] as string | null

  if (exceptions) return 'checkHours'
  if (!start || !end) return 'closed'

  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const currentTime = `${h}:${m}:00`
  return currentTime >= start && currentTime <= end ? 'openNow' : 'closed'
})

const detailTags = computed<TagConfig[]>(() => {
  const candidates: (TagConfig | null)[] = [
    !!p.value.wait_sameday_sick_ad || !!p.value.wait_sameday_sick_ch
      ? { text: 'Walk-ins available', color: 'purple', icon: IconPersonWalking }
      : null,
    p.value.primary_telehealth === 'Yes'
      ? { text: 'Telehealth', color: 'purple', icon: IconVideo }
      : null,
    p.value.transport_parking ? { text: 'Parking on site', color: 'blue', icon: IconCar } : null,
    p.value.special_pharmacy === 'Yes'
      ? { text: 'Pharmacy on site', color: 'blue', icon: IconSuitcaseMedical }
      : null,
  ]
  return candidates.filter((t): t is TagConfig => t !== null)
})

const cardTags = computed<TagConfig[]>(() => {
  const now = new Date()
  const dayKey = DAYS[now.getDay()]
  const todayEnd = p.value[`hours_${dayKey}_end`] as string | null

  const candidates: (TagConfig | null)[] = [
    {
      text:
        hoursStatus.value === 'openNow'
          ? 'Open now'
          : hoursStatus.value === 'closed'
            ? 'Closed'
            : 'Check hours',
      color:
        hoursStatus.value === 'openNow'
          ? 'green'
          : hoursStatus.value === 'closed'
            ? 'red'
            : 'yellow',
      icon: IconClock,
      tooltip: todaysHoursTooltip.value,
    },
    !!p.value.hours_sat_start || !!p.value.hours_sun_start
      ? { text: 'Weekend hours', color: 'blue', icon: IconClock, tooltip: todaysHoursTooltip.value }
      : null,
    !!todayEnd && todayEnd >= '18:00:00'
      ? {
          text: 'Open after 6PM',
          color: 'blue',
          icon: IconClock,
          tooltip: todaysHoursTooltip.value,
        }
      : null,
    !!p.value.wait_sameday_sick_ad || !!p.value.wait_sameday_sick_ch
      ? { text: 'Walk-ins available', color: 'purple', icon: IconPersonWalking }
      : null,
    p.value.primary_telehealth === 'Yes'
      ? { text: 'Telehealth', color: 'purple', icon: IconVideo }
      : null,
    p.value.transport_parking ? { text: 'Parking on site', color: 'blue', icon: IconCar } : null,
    p.value.special_pharmacy === 'Yes'
      ? { text: 'Pharmacy on site', color: 'blue', icon: IconSuitcaseMedical }
      : null,
    [
      'primary_well_ad',
      'primary_sick_ad',
      'primary_vacc_ad',
      'special_mental_ad',
      'special_dental_ad',
      'special_eye_ad',
    ].some((f) => YES_VALUES.includes((p.value[f] as string) ?? ''))
      ? { text: 'Adult care', color: 'purple', icon: IconPerson }
      : null,
    [
      'primary_well_ch',
      'primary_sick_ch',
      'primary_vacc_child',
      'special_mental_ch',
      'special_dental_ch',
      'special_eye_ch',
    ].some((f) => YES_VALUES.includes((p.value[f] as string) ?? ''))
      ? { text: 'Pediatrics', color: 'purple', icon: IconPerson }
      : null,
    !!p.value.language && p.value.language.split(',').filter(Boolean).length > 1
      ? {
          text: 'Multiple languages',
          color: 'purple',
          icon: IconLanguage,
          // tooltip: (() => {
          //   const langs = p.value.language!.split(',').map((l) => l.trim()).filter(Boolean)
          //   const shown = langs.slice(0, 4)
          //   const rest = langs.length - shown.length
          //   return rest > 0 ? `${shown.join(', ')} +${rest} more` : shown.join(', ')
          // })(),
        }
      : null,
  ]

  const max = props.max ?? 3
  return candidates.filter((t): t is TagConfig => t !== null).slice(0, max)
})

const visibleTags = computed(() => (props.detail ? detailTags.value : cardTags.value))
</script>

<template>
  <div class="location-tags">
    <template v-for="tag in visibleTags" :key="tag.text">
      <Tooltip v-if="tag.tooltip" trigger="hover" type="plain">
        <Tags
          variant="readonly"
          :size="detail ? 'medium' : 'small'"
          :color="tag.color"
          :icon="tag.icon"
          :text="tag.text"
        />
        <template #body>{{ tag.tooltip }}</template>
      </Tooltip>
      <Tags
        v-else
        variant="readonly"
        :size="detail ? 'medium' : 'small'"
        :color="tag.color"
        :icon="tag.icon"
        :text="tag.text"
      />
    </template>
  </div>
</template>

<style scoped>
.location-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
