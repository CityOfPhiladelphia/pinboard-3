<script setup lang="ts">
import { computed } from 'vue'
import { format, parseISO } from 'date-fns'
import { useI18n } from 'vue-i18n'
import type { PrimaryCareLocation } from '@/types'
import { PhilaButton } from '@phila/phila-ui-button'
import { PhilaLink, Icon } from '@pinboard/ui'
import {
  IconClose,
  IconPhone,
  IconGlobe,
  IconLocationDot,
  IconLanguage,
  IconBus,
  IconClock,
} from '@phila/phila-ui-core/icons'

const props = defineProps<{
  location: PrimaryCareLocation
  onClose: () => void
}>()

const { t, locale, messages } = useI18n()

const fullAddress = computed(() => {
  let addr = props.location.address
  if (props.location.address_2) addr += ', ' + props.location.address_2
  addr += ', Philadelphia, PA ' + props.location.zip_code
  return addr
})

<<<<<<< HEAD
=======
function mapsUrl(): string {
  const parts = [p.value.address, p.value.address_2, p.value.zip_code, 'Philadelphia, PA'].filter(
    Boolean
  )
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`
}

function siteName(): string {
  let value = p.value.record
  if (
    value === 'Delaware Valley Community Health (DVCH) Maria de los Santos Womens Health Center'
  ) {
    value = "Delaware Valley Community Health (DVCH) Maria de los Santos Women's Health Center"
  }
  return value
}

>>>>>>> b9b487173b7baa2cfe1194942e215adc54bd4d74
// --- Age-specific services ---
interface ServiceRow {
  id: number
  service: string
  adult: string | null
  child: string | null
  existing: (string | null)[]
}

const YES_VALUES = ['Yes', 'Established Patients']

const ageSpecificServices = computed<ServiceRow[]>(() => {
  const rows: ServiceRow[] = []
  const checks: [string, string, string][] = [
    ['visitType.well', 'primary_well_ad', 'primary_well_ch'],
    ['visitType.sick', 'primary_sick_ad', 'primary_sick_ch'],
    ['visitType.vaccine', 'primary_vacc_ad', 'primary_vacc_child'],
    ['specialty.mental', 'special_mental_ad', 'special_mental_ch'],
    ['specialty.dental', 'special_dental_ad', 'special_dental_ch'],
    ['specialty.eye', 'special_eye_ad', 'special_eye_ch'],
  ]
  let id = 1
  for (const [service, adultField, childField] of checks) {
    const adult = props.location[adultField] as string | null
    const child = props.location[childField] as string | null
    if (YES_VALUES.includes(adult ?? '') || YES_VALUES.includes(child ?? '')) {
      rows.push({ id: id++, service, adult, child, existing: [adult, child] })
    }
  }
  return rows
})

// --- Other services ---
interface OtherServiceRow {
  id: number
  service: string
  value: string | null
}

const otherServices = computed<OtherServiceRow[]>(() => {
  const rows: OtherServiceRow[] = []
  const checks: [string, string][] = [
    ['visitType.sports', 'primary_sports'],
    ['visitType.prenatal', 'primary_prenatal'],
    ['visitType.women', 'primary_women'],
    ['specialty.mat', 'special_mat'],
    ['specialty.podiatry', 'special_podiatry'],
    ['specialty.nutrition', 'special_nutrition'],
    ['specialty.tobacco', 'special_tobacco'],
    ['visitType.telehealth', 'primary_telehealth'],
    ['specialty.pharmacy', 'special_pharmacy'],
  ]
  let id = 1
  for (const [service, field] of checks) {
    const val = props.location[field] as string | null
    if (YES_VALUES.includes(val ?? '')) {
      rows.push({ id: id++, service, value: val })
    }
  }
  return rows
})

// --- Hours ---
const DAYS = ['mon', 'tues', 'wed', 'thurs', 'fri', 'sat', 'sun'] as const
const DAY_I18N_KEYS: Record<(typeof DAYS)[number], string> = {
  mon: 'Monday',
  tues: 'Tuesday',
  wed: 'Wednesday',
  thurs: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

const exceptionsByDay = computed(() => {
  const result: Record<string, string> = {}
  for (const day of DAYS) {
    const exc = props.location[`hours_${day}_exceptions`] as string | null
    if (exc) result[day] = exc
  }
  return result
})

const exceptionsList = computed(() => {
  const arr: string[] = []
  for (const day of DAYS) {
    const exc = props.location[`hours_${day}_exceptions`] as string | null
    if (exc) arr.push(exc)
  }
  return [...new Set(arr)]
})

function parseTime(raw: string | null): string {
  if (!raw) return ''
  return format(parseISO('2022-05-24T' + raw), 'h:mm aaaa')
}

function exceptionCounter(day: string): number | null {
  const exc = exceptionsByDay.value[day]
  if (!exc) return null
  return 1 + exceptionsList.value.indexOf(exc)
}

function parseTimeRange(day: string): string {
  const start = props.location[`hours_${day}_start`] as string | null
  const end = props.location[`hours_${day}_end`] as string | null
  const counter = exceptionCounter(day)
  let val: string
  if (start && end) {
    val = parseTime(start) + ' - ' + parseTime(end)
  } else {
    val = t('closed')
  }
  if (counter) val += '*'.repeat(counter)
  return val
}

// --- Tests ---
const tests = computed(() => {
  const fields = ['blood', 'sti', 'covid', 'mammo', 'xray']
  return fields.filter((f) => props.location[`tests_${f}`] === 'Yes')
})

// --- Languages ---
const languagesSpoken = computed<string[]>(() => {
  if (!props.location.language) return []
  return props.location.language.split(',').map((s) => s.trim())
})

function translateLanguage(lang: string): string {
  const msgs = messages.value[locale.value] as Record<string, Record<string, string>>
  return msgs?.languages?.[lang.toLowerCase()] ?? lang
}

function translateWarning(warning: string): string {
  const msgs = messages.value[locale.value] as Record<string, Record<string, string>>
  return msgs?.warnings?.[warning] ?? warning
}

// --- Transit helpers ---
function translateTransitList(raw: string | null, category: string): string {
  if (!raw) return ''
  const msgs = messages.value[locale.value] as Record<
    string,
    Record<string, Record<string, string>>
  >
  const translations = msgs?.transit?.[category]
  return raw
    .split(',')
    .map((s) => {
      const key = s.trim()
      return translations?.[key] ?? key
    })
    .join(', ')
}
</script>

<template>
  <div class="location-detail content">
    <div class="detail-header">
      <h2>{{ location.name }}</h2>
      <PhilaButton
        :icon="IconClose"
        :icon-only="true"
        variant="standard"
        size="small"
        class="detail-close-btn"
        :aria-label="t('closeDetails')"
        @click="onClose"
      />
    </div>

    <div class="detail-body">
      <span class="has-text-label-default">Location details</span>

      <div class="detail-columns">
        <div class="detail-col-left">
          <div class="detail-cell">
            <Icon :icon="IconPhone" inline class="cell-icon" />
            <span class="has-text-label-small cell-label">Contact</span>
            <div class="cell-content">
              <PhilaLink v-if="p.med_phone_num" :href="`tel:${p.med_phone_num}`" size="small">
                {{ p.med_phone_num }}
              </PhilaLink>
            </div>
          </div>
          <div class="detail-cell">
            <Icon :icon="IconGlobe" inline class="cell-icon" />
            <span class="has-text-label-small cell-label">Website</span>
            <div class="cell-content">
              <PhilaLink
                v-if="p.website"
                :href="p.website"
                size="small"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ p.website }}
              </PhilaLink>
            </div>
          </div>
          <div class="detail-cell">
            <Icon :icon="IconLanguage" inline class="cell-icon" />
            <span class="has-text-label-small cell-label">Languages spoken</span>
            <div class="cell-content">
              <span class="has-text-body-small">
                {{ languagesSpoken.map(translateLanguage).join(', ') }}
              </span>
            </div>
          </div>
          <div class="detail-cell">
            <Icon :icon="IconBus" inline class="cell-icon" />
            <span class="has-text-label-small cell-label">Transit options</span>
            <div class="cell-content cell-list">
              <span v-if="p.transport_bus" class="has-text-body-small">
                {{ $t('transit.bus') }}: {{ p.transport_bus }}
              </span>
              <span v-if="p.transport_subway" class="has-text-body-small">
                {{ $t('transit.subway.label') }}:
                {{ translateTransitList(p.transport_subway, 'subway') }}
              </span>
              <span v-if="p.transport_train" class="has-text-body-small">
                {{ $t('transit.regRail.label') }}:
                {{ translateTransitList(p.transport_train, 'regRail') }}
              </span>
              <span v-if="p.transport_trolley" class="has-text-body-small">
                {{ $t('transit.trolley') }}: {{ p.transport_trolley }}
              </span>
              <span v-if="p.transport_parking" class="has-text-body-small">
                {{ $t('transit.car.label') }}:
                {{ translateTransitList(p.transport_parking, 'car') }}
              </span>
            </div>
          </div>
        </div>
        <div class="detail-col-right">
          <div class="detail-cell">
            <Icon :icon="IconLocationDot" inline class="cell-icon" />
            <span class="has-text-label-small cell-label">Location</span>
            <div class="cell-content">
              <PhilaLink :href="mapsUrl()" size="small" target="_blank" rel="noopener noreferrer">
                {{ fullAddress }}
              </PhilaLink>
            </div>
          </div>
          <div class="detail-cell">
            <Icon :icon="IconClock" inline class="cell-icon" />
            <span class="has-text-label-small cell-label">Hours</span>
            <div class="cell-content hours-list">
              <div v-for="day in DAYS" :key="day" class="hours-row">
                <span class="has-text-body-small hours-day">{{ $t(DAY_I18N_KEYS[day]) }}</span>
                <span class="has-text-body-small">{{ parseTimeRange(day) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Warning callout -->
      <div v-if="location.optional_info_general" class="warning-callout">
        {{ translateWarning(location.optional_info_general) }}
      </div>

<<<<<<< HEAD
      <!-- Contact info -->
      <section class="contact-section">
        <div v-if="location.address" class="contact-row">
          <span class="contact-label">{{ fullAddress }}</span>
        </div>
        <div v-if="location.website" class="contact-row">
          <a :href="location.website" target="_blank">{{ location.website }}</a>
        </div>
        <div v-if="location.med_phone_num" class="contact-row">
          {{ location.med_phone_num }}
        </div>
      </section>

      <!-- Transit -->
      <section
        v-if="
          location.transport_bus ||
          location.transport_subway ||
          location.transport_train ||
          location.transport_trolley ||
          location.transport_parking
        "
        class="transit-section"
      >
        <div v-if="location.transport_bus">
          <strong>{{ $t('transit.bus') }}:</strong> {{ location.transport_bus }}
        </div>
        <div v-if="location.transport_subway">
          <strong>{{ $t('transit.subway.label') }}:</strong>
          {{ translateTransitList(location.transport_subway, 'subway') }}
        </div>
        <div v-if="location.transport_train">
          <strong>{{ $t('transit.regRail.label') }}:</strong>
          {{ translateTransitList(location.transport_train, 'regRail') }}
        </div>
        <div v-if="location.transport_trolley">
          <strong>{{ $t('transit.trolley') }}:</strong>
          {{ location.transport_trolley }}
        </div>
        <div v-if="location.transport_parking">
          <strong>{{ $t('transit.car.label') }}:</strong>
          {{ translateTransitList(location.transport_parking, 'car') }}
        </div>
      </section>

      <!-- Languages -->
      <section v-if="languagesSpoken.length">
        <strong>{{ $t('languagesSpoken') }}:</strong>
        {{ languagesSpoken.map(translateLanguage).join(', ') }}
      </section>
=======
      <span class="has-text-label-default">Services available</span>
>>>>>>> b9b487173b7baa2cfe1194942e215adc54bd4d74

      <!-- Age-specific services table -->
      <section class="services-section">
        <span class="has-text-label-small cell-label">{{ $t('ageSpecificServices') }}</span>
        <span class="has-text-body-small">{{ $t('cards.table1Intro') }}</span>
        <table v-if="ageSpecificServices.length" class="data-table">
          <thead>
            <tr>
              <th>{{ $t('service') }}</th>
              <th class="center">{{ $t('ageRange.adult') }}</th>
              <th class="center">{{ $t('ageRange.child') }}</th>
              <th class="center">
                {{ $t('patientType.patient_type_existing_only') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in ageSpecificServices" :key="row.id">
              <td>{{ $t(row.service) }}</td>
              <td class="center">
                {{ YES_VALUES.includes(row.adult ?? '') ? '✓' : '' }}
              </td>
              <td class="center">
                {{ YES_VALUES.includes(row.child ?? '') ? '✓' : '' }}
              </td>
              <td class="center">
                {{ row.existing.includes('Established Patients') ? '✓' : '' }}
              </td>
            </tr>
          </tbody>
        </table>
        <span v-else class="has-text-body-small">{{
          $t('tableNoData.noSpecializedServices')
        }}</span>
      </section>

      <!-- Other services table -->
      <section class="services-section">
        <span class="has-text-label-small cell-label">{{ $t('otherServices') }}</span>
        <span class="has-text-body-small">{{ $t('cards.table2Intro') }}</span>
        <table v-if="otherServices.length" class="data-table">
          <thead>
            <tr>
              <th>{{ $t('service') }}</th>
              <th class="center">{{ $t('patientType.patient_type_new') }}</th>
              <th class="center">
                {{ $t('patientType.patient_type_existing') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in otherServices" :key="row.id">
              <td>{{ $t(row.service) }}</td>
              <td class="center">{{ row.value === 'Yes' ? '✓' : '' }}</td>
              <td class="center">
                {{ YES_VALUES.includes(row.value ?? '') ? '✓' : '' }}
              </td>
            </tr>
          </tbody>
        </table>
        <span v-else class="has-text-body-small">{{ $t('tableNoData.noOtherServices') }}</span>
      </section>

      <!-- Tests -->
      <section class="services-section">
        <span class="has-text-label-small cell-label">{{ $t('tests.category') }}</span>
        <div v-if="tests.length" class="cell-list">
          <span v-for="test in tests" :key="test" class="has-text-body-small">{{
            $t(`tests.${test}`)
          }}</span>
        </div>
        <span v-else class="has-text-body-small">{{ $t('tests.noTests') }}</span>
      </section>

      <!-- Sliding scale -->
<<<<<<< HEAD
      <section>
        <h3>{{ $t('slidingScale') }}</h3>
        <p>{{ $t('slidingScaleExplanation') }}</p>
        <p>{{ location.sliding_scale ?? $t('slidingScaleNull') }}</p>
=======
      <section class="services-section">
        <span class="has-text-label-small cell-label">{{ $t('slidingScale') }}</span>
        <span class="has-text-body-small">{{ $t('slidingScaleExplanation') }}</span>
        <span class="has-text-body-small">{{ p.sliding_scale ?? $t('slidingScaleNull') }}</span>
>>>>>>> b9b487173b7baa2cfe1194942e215adc54bd4d74
      </section>
    </div>
  </div>
</template>

<style scoped>
.location-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
  flex-shrink: 0;
}

.detail-header h2 {
  font-size: 1.25rem;
  margin: 0;
  flex: 1;
}

.detail-close-btn {
  flex-shrink: 0;
}

.detail-close-btn :deep(svg) {
  color: var(--Schemes-On-Primary-Container);
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px), (max-width: 1064px) and (max-height: 600px) {
  .detail-columns {
    grid-template-columns: 1fr;
  }
}

.detail-col-left,
.detail-col-right {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-cell {
  display: grid;
  grid-template-columns: 1rem 1fr;
  column-gap: 0.5rem;
  row-gap: 0.25rem;
  align-items: start;
}

.cell-icon {
  margin-top: 1px;
  color: var(--Schemes-On-Surface-Low);
}

.cell-label {
  color: var(--Schemes-On-Surface-Low);
  padding-top: 2px;
}

.cell-content {
  grid-column: 2;
}

.cell-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.hours-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.hours-row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.hours-day {
  color: var(--Schemes-On-Surface-Low);
}

.services-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.warning-callout {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 0.75rem 1rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}

.data-table th,
.data-table td {
  border: 1px solid #ddd;
  padding: 0.5rem;
  text-align: left;
}

.data-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.center {
  text-align: center;
}
</style>
