<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Tags, Tooltip } from '@pinboard/ui'
import type { TagColor } from '@phila/phila-ui-tags'
import type { IconComponent } from '@phila/phila-ui-core'
import {
  IconCar,
  IconSuitcaseMedical,
  IconVideo,
  IconPersonWalking,
  IconClock,
} from '@phila/phila-ui-core/icons'
import type { PrimaryCareLocation } from '@/types'
import { useNow } from '@/composables/useNow'

const props = defineProps<{
  location: PrimaryCareLocation
  max?: number
  detail?: boolean
}>()

const { t, locale, messages } = useI18n()

// Reactive clock so open/closed status re-evaluates as time passes (e.g. a site
// closing at 5 flips to "Closed" without needing a reload).
const clock = useNow()

const DAYS = ['sun', 'mon', 'tues', 'wed', 'thurs', 'fri', 'sat'] as const

const LATER_HOURS_MAP: Partial<Record<(typeof DAYS)[number], 'M' | 'T' | 'W' | 'R' | 'F'>> = {
  mon: 'M',
  tues: 'T',
  wed: 'W',
  thurs: 'R',
  fri: 'F',
}

interface TagConfig {
  text: string
  color: TagColor
  icon: IconComponent
  tooltip?: string
}

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(':')
  let h = parseInt(hStr)
  const ampm = h >= 12 ? 'pm' : 'am'
  h = h % 12 || 12
  return mStr === '00' ? `${h}\u00A0${ampm}` : `${h}:${mStr}\u00A0${ampm}`
}

const todaysHoursTooltip = computed<string>(() => {
  const dayKey = DAYS[clock.value.getDay()]
  const start = props.location.properties[`hours_${dayKey}_start`] as string | null
  const end = props.location.properties[`hours_${dayKey}_end`] as string | null
  if (!start || !end) return t('tags.todayClosed')
  return t('tags.todayHours', { range: `${formatTime(start)}\u00A0–\u00A0${formatTime(end)}` })
})

const hoursStatus = computed<'openNow' | 'closed' | 'checkHours'>(() => {
  const now = clock.value
  const dayKey = DAYS[now.getDay()]
  const start = props.location.properties[`hours_${dayKey}_start`] as string | null
  const end = props.location.properties[`hours_${dayKey}_end`] as string | null
  const exceptions = props.location.properties[`hours_${dayKey}_exceptions`] as string | null

  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const currentTime = `${h}:${m}:00`

  if (!start || currentTime < start) return 'closed'

  if (!exceptions) {
    return end && currentTime < end ? 'openNow' : 'closed'
  }

  const laterDayCode = LATER_HOURS_MAP[dayKey]
  if (laterDayCode && props.location.properties.later_hours_day === laterDayCode) {
    return 'checkHours'
  }

  return end && currentTime < end ? 'checkHours' : 'closed'
})

const detailTags = computed<TagConfig[]>(() => {
  const candidates: (TagConfig | null)[] = [
    props.location.properties.walk_ins_sick === 'Yes'
      ? { text: t('tags.walkIns'), color: 'purple', icon: IconPersonWalking }
      : null,
    props.location.properties.primary_telehealth === 'Yes'
      ? { text: t('tags.telehealth'), color: 'purple', icon: IconVideo }
      : null,
    props.location.properties.transport_parking &&
    /GP|FG|OS(?!T)/.test(props.location.properties.transport_parking)
      ? { text: t('tags.parking'), color: 'blue', icon: IconCar }
      : null,
    props.location.properties.special_pharmacy === 'Yes'
      ? { text: t('tags.pharmacy'), color: 'blue', icon: IconSuitcaseMedical }
      : null,
    props.location.properties.weekend_hrs === 'Yes'
      ? { text: t('tags.weekendHours'), color: 'blue', icon: IconClock }
      : null,
    props.location.properties.evening_hrs === 'Yes'
      ? {
          text: t('tags.eveningHours'),
          color: 'blue',
          icon: IconClock,
          tooltip: t('tags.openAfter6'),
        }
      : null,
  ]
  return candidates.filter((t): t is TagConfig => t !== null)
})

const todaysException = computed<string | undefined>(() => {
  const dayKey = DAYS[clock.value.getDay()]
  const exc = props.location.properties[`hours_${dayKey}_exceptions`] as string | null
  if (!exc) return undefined
  const msgs = messages.value[locale.value] as Record<string, Record<string, string>>
  return msgs?.exceptions?.[exc] ?? exc
})

const cardTags = computed<TagConfig[]>(() => {
  const now = clock.value
  const dayKey = DAYS[now.getDay()]
  const todayEnd = props.location.properties[`hours_${dayKey}_end`] as string | null

  const candidates: (TagConfig | null)[] = [
    {
      text:
        hoursStatus.value === 'openNow'
          ? t('tags.openNow')
          : hoursStatus.value === 'closed'
            ? t('tags.closed')
            : t('tags.checkHours'),
      color:
        hoursStatus.value === 'openNow'
          ? 'green'
          : hoursStatus.value === 'closed'
            ? 'red'
            : 'yellow',
      icon: IconClock,
      tooltip:
        hoursStatus.value === 'checkHours' && todaysException.value
          ? `${todaysHoursTooltip.value} – ${todaysException.value}`
          : todaysHoursTooltip.value,
    },
    !!props.location.properties.hours_sat_start || !!props.location.properties.hours_sun_start
      ? { text: t('tags.weekendHours'), color: 'blue', icon: IconClock }
      : null,
    !!todayEnd && todayEnd >= '18:00:00'
      ? {
          text: t('tags.eveningHours'),
          color: 'blue',
          icon: IconClock,
          tooltip: t('tags.openAfter6'),
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
