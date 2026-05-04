<script setup lang="ts">
import { computed } from 'vue'
import { format, parseISO } from 'date-fns'
import { useI18n } from 'vue-i18n'
import type { PrimaryCareLocation } from '@/types'
import { PhilaButton } from '@phila/phila-ui-button'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

const props = defineProps<{
  location: PrimaryCareLocation
  onClose: () => void
}>()

const { t, locale, messages } = useI18n()

const p = computed(() => props.location.properties)

const fullAddress = computed(() => {
  let addr = p.value.address
  if (p.value.address_2) addr += ', ' + p.value.address_2
  addr += ', Philadelphia, PA ' + p.value.zip_code
  return addr
})

function siteName(): string {
  let value = p.value.record
  if (
    value ===
    'Delaware Valley Community Health (DVCH) Maria de los Santos Womens Health Center'
  ) {
    value =
      "Delaware Valley Community Health (DVCH) Maria de los Santos Women's Health Center"
  }
  return value
}

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
    const adult = p.value[adultField] as string | null
    const child = p.value[childField] as string | null
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
    const val = p.value[field] as string | null
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
    const exc = p.value[`hours_${day}_exceptions`] as string | null
    if (exc) result[day] = exc
  }
  return result
})

const exceptionsList = computed(() => {
  const arr: string[] = []
  for (const day of DAYS) {
    const exc = p.value[`hours_${day}_exceptions`] as string | null
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
  const start = p.value[`hours_${day}_start`] as string | null
  const end = p.value[`hours_${day}_end`] as string | null
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

function parseException(exception: string, index: number): string {
  const stars = '*'.repeat(index)
  const msgs = messages.value[locale.value] as Record<
    string,
    Record<string, string>
  >
  const translated = msgs?.exceptions?.[exception]
  return stars + ' ' + (translated ?? exception)
}

// --- Tests ---
const tests = computed(() => {
  const fields = ['blood', 'sti', 'covid', 'mammo', 'xray']
  return fields.filter((f) => p.value[`tests_${f}`] === 'Yes')
})

// --- Languages ---
const languagesSpoken = computed<string[]>(() => {
  if (!p.value.language) return []
  return p.value.language.split(',').map((s) => s.trim())
})

function translateLanguage(lang: string): string {
  const msgs = messages.value[locale.value] as Record<
    string,
    Record<string, string>
  >
  return msgs?.languages?.[lang.toLowerCase()] ?? lang
}

function translateWarning(warning: string): string {
  const msgs = messages.value[locale.value] as Record<
    string,
    Record<string, string>
  >
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
      <h2>{{ siteName() }}</h2>
      <PhilaButton
        :icon-definition="faXmark"
        :icon-only="true"
        variant="standard"
        size="small"
        class="detail-close-btn"
        aria-label="Close details"
        @click="onClose"
      />
    </div>

    <div class="detail-body">
      <!-- Warning callout -->
      <div v-if="p.optional_info_general" class="warning-callout">
        {{ translateWarning(p.optional_info_general) }}
      </div>

      <!-- Contact info -->
      <section class="contact-section">
        <div v-if="p.address" class="contact-row">
          <span class="contact-label">{{ fullAddress }}</span>
        </div>
        <div v-if="p.website" class="contact-row">
          <a :href="p.website" target="_blank">{{ p.website }}</a>
        </div>
        <div v-if="p.med_phone_num" class="contact-row">
          {{ p.med_phone_num }}
        </div>
      </section>

      <!-- Transit -->
      <section
        v-if="
          p.transport_bus ||
          p.transport_subway ||
          p.transport_train ||
          p.transport_trolley ||
          p.transport_parking
        "
        class="transit-section"
      >
        <div v-if="p.transport_bus">
          <strong>{{ $t('transit.bus') }}:</strong> {{ p.transport_bus }}
        </div>
        <div v-if="p.transport_subway">
          <strong>{{ $t('transit.subway.label') }}:</strong>
          {{ translateTransitList(p.transport_subway, 'subway') }}
        </div>
        <div v-if="p.transport_train">
          <strong>{{ $t('transit.regRail.label') }}:</strong>
          {{ translateTransitList(p.transport_train, 'regRail') }}
        </div>
        <div v-if="p.transport_trolley">
          <strong>{{ $t('transit.trolley') }}:</strong>
          {{ p.transport_trolley }}
        </div>
        <div v-if="p.transport_parking">
          <strong>{{ $t('transit.car.label') }}:</strong>
          {{ translateTransitList(p.transport_parking, 'car') }}
        </div>
      </section>

      <!-- Languages -->
      <section v-if="languagesSpoken.length">
        <strong>{{ $t('languagesSpoken') }}:</strong>
        {{ languagesSpoken.map(translateLanguage).join(', ') }}
      </section>

      <!-- Age-specific services table -->
      <section>
        <h3>{{ $t('ageSpecificServices') }}</h3>
        <p>{{ $t('cards.table1Intro') }}</p>
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
        <p v-else>{{ $t('tableNoData.noSpecializedServices') }}</p>
      </section>

      <!-- Other services table -->
      <section>
        <h3>{{ $t('otherServices') }}</h3>
        <p>{{ $t('cards.table2Intro') }}</p>
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
        <p v-else>{{ $t('tableNoData.noOtherServices') }}</p>
      </section>

      <!-- Hours table -->
      <section>
        <h3>{{ $t('hours') }}</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('daysOfTheWeek') }}</th>
              <th>{{ $t('schedule') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in DAYS" :key="day">
              <td>{{ $t(DAY_I18N_KEYS[day]) }}</td>
              <td>{{ parseTimeRange(day) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="exceptionsList.length" class="exceptions">
          <div v-for="(exc, i) in exceptionsList" :key="i">
            {{ parseException(exc, i + 1) }}
          </div>
        </div>
      </section>

      <!-- Tests -->
      <section>
        <h3>{{ $t('tests.category') }}</h3>
        <ul v-if="tests.length">
          <li v-for="test in tests" :key="test">{{ $t(`tests.${test}`) }}</li>
        </ul>
        <p v-else>{{ $t('tests.noTests') }}</p>
      </section>

      <!-- Sliding scale -->
      <section>
        <h3>{{ $t('slidingScale') }}</h3>
        <p>{{ $t('slidingScaleExplanation') }}</p>
        <p>{{ p.sliding_scale ?? $t('slidingScaleNull') }}</p>
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

.warning-callout {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 0.75rem 1rem;
}

.contact-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.transit-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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

.exceptions {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}
</style>
