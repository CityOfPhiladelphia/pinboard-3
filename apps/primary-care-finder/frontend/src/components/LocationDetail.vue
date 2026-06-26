<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PrimaryCareField, PrimaryCareLocation } from '@/types'
import { PhilaButton } from '@phila/phila-ui-button'
import { PhilaLink } from '@pinboard/ui'
import LocationTags from './LocationTags.vue'
import { IconClose } from '@phila/phila-ui-core/icons'

const props = defineProps<{
  location: PrimaryCareLocation
  onClose: () => void
}>()

const { t, locale, messages } = useI18n()

const p = computed(() => props.location.properties)

const fullAddress = computed(() => {
  let addr = props.location.properties.address
  if (props.location.properties.address_2) addr += ', ' + props.location.properties.address_2
  addr += ', Philadelphia, PA ' + props.location.properties.zip_code
  return addr
})

function mapsUrl(): string {
  const parts = [
    props.location.properties.address,
    props.location.properties.address_2,
    props.location.properties.zip_code,
    'Philadelphia, PA',
  ].filter(Boolean)
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`
}

const ALL_SERVICES: [string, PrimaryCareField[]][] = [
  ['visitType.well', ['primary_well']],
  ['visitType.sick', ['primary_sick']],
  ['visitType.vaccine', ['primary_vacc']],
  ['specialty.mental', ['special_mental']],
  ['specialty.dental', ['special_dental']],
  ['specialty.eye', ['special_eye']],
  ['visitType.sports', ['primary_sports']],
  ['visitType.prenatal', ['primary_prenatal']],
  ['visitType.women', ['primary_women']],
  ['specialty.mat', ['special_mat']],
  ['specialty.podiatry', ['special_podiatry']],
  ['specialty.nutrition', ['special_nutrition']],
  ['specialty.tobacco', ['special_tobacco']],
  ['visitType.telehealth', ['primary_telehealth']],
  ['specialty.pharmacy', ['special_pharmacy']],
]

// Services available to new patients or walk-ins (any field is "Yes")
const newPatientServices = computed<string[]>(() =>
  ALL_SERVICES.filter(([, fields]) =>
    fields.some((f) => (props.location.properties[f] as string | null) === 'Yes')
  ).map(([label]) => label)
)

// Services exclusive to existing patients (no field is "Yes", but at least one is "Established Patients")
const existingOnlyServices = computed<string[]>(() =>
  ALL_SERVICES.filter(
    ([, fields]) =>
      !fields.some((f) => (props.location.properties[f] as string | null) === 'Yes') &&
      fields.some((f) => (props.location.properties[f] as string | null) === 'Established Patients')
  ).map(([label]) => label)
)

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
    const exc = props.location.properties[`hours_${day}_exceptions`] as string | null
    if (exc) result[day] = exc
  }
  return result
})

function parseTime(raw: string | null): string {
  if (!raw) return ''
  const [hStr, mStr] = raw.split(':')
  let h = parseInt(hStr)
  const ampm = h >= 12 ? 'pm' : 'am'
  h = h % 12 || 12
  return mStr === '00' ? `${h}\u00A0${ampm}` : `${h}:${mStr}\u00A0${ampm}`
}

function getExceptionText(day: string): string | null {
  const exc = exceptionsByDay.value[day]
  if (!exc) return null
  const msgs = messages.value[locale.value] as Record<string, Record<string, string>>
  return msgs?.exceptions?.[exc] ?? exc
}

function parseTimeRange(day: string): string {
  const props = p.value as unknown as Record<string, string | null>
  const start = props[`hours_${day}_start`]
  const end = props[`hours_${day}_end`]
  let val: string
  if (start && end) {
    val = parseTime(start) + '\u00A0–\u00A0' + parseTime(end)
  } else {
    val = t('closed')
  }
  if (exceptionsByDay.value[day]) val += '*'
  return val
}

// --- Tests ---
const tests = computed(() => {
  const fields: PrimaryCareField[] = [
    'tests_blood',
    'tests_sti',
    'tests_covid',
    'tests_mammo',
    'tests_xray',
  ]
  return fields.filter((f) => props.location.properties[f] === 'Yes')
})

// --- Languages ---
const languagesSpoken = computed<string[]>(() => {
  if (!props.location.properties.languages) return []
  return props.location.properties.languages.split(',').map((s) => s.trim())
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
const hasTransit = computed(() =>
  Boolean(
    p.value.transport_bus ||
    p.value.transport_subway ||
    p.value.transport_train ||
    p.value.transport_trolley ||
    p.value.transport_parking
  )
)

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
      <LocationTags :location="location" detail />
      <span class="has-text-label-default">{{ $t('locationDetails') }}</span>

      <div class="detail-columns">
        <div class="detail-col-left">
          <div v-if="p.med_phone_num" class="detail-cell">
            <span class="has-text-label-small cell-label">{{ $t('contact') }}</span>
            <div class="cell-content">
              <PhilaLink :href="`tel:${p.med_phone_num}`" size="small">
                {{ p.med_phone_num }}
              </PhilaLink>
            </div>
          </div>
          <div v-if="p.website" class="detail-cell">
            <span class="has-text-label-small cell-label">{{ $t('website') }}</span>
            <div class="cell-content">
              <PhilaLink :href="p.website" size="small" target="_blank" rel="noopener noreferrer">
                {{ $t('providerWebsite') }}
              </PhilaLink>
            </div>
          </div>
          <div v-if="languagesSpoken.length" class="detail-cell">
            <span class="has-text-label-small cell-label">{{ $t('languagesSpoken') }}</span>
            <div class="cell-content">
              <span class="has-text-body-small">
                {{ languagesSpoken.map(translateLanguage).join(', ') }}
              </span>
            </div>
          </div>
          <div v-if="hasTransit" class="detail-cell">
            <span class="has-text-label-small cell-label">{{ $t('transitOptions') }}</span>
            <div class="cell-content cell-list">
              <span v-if="location.properties.transport_bus" class="has-text-body-small">
                {{ $t('transit.bus') }}: {{ location.properties.transport_bus }}
              </span>
              <span v-if="location.properties.transport_subway" class="has-text-body-small">
                {{ $t('transit.subway.label') }}:
                {{ translateTransitList(location.properties.transport_subway, 'subway') }}
              </span>
              <span v-if="location.properties.transport_train" class="has-text-body-small">
                {{ $t('transit.regRail.label') }}:
                {{ translateTransitList(location.properties.transport_train, 'regRail') }}
              </span>
              <span v-if="location.properties.transport_trolley" class="has-text-body-small">
                {{ $t('transit.trolley') }}: {{ location.properties.transport_trolley }}
              </span>
              <span v-if="location.properties.transport_parking" class="has-text-body-small">
                {{ $t('transit.car.label') }}:
                {{ translateTransitList(location.properties.transport_parking, 'car') }}
              </span>
            </div>
          </div>
        </div>
        <div class="detail-col-right">
          <div class="detail-cell">
            <span class="has-text-label-small cell-label">{{ $t('location') }}</span>
            <div class="cell-content">
              <PhilaLink :href="mapsUrl()" size="small" target="_blank" rel="noopener noreferrer">
                {{ fullAddress }}
              </PhilaLink>
            </div>
          </div>
          <div class="detail-cell">
            <span class="has-text-label-small cell-label">{{ $t('hours') }}</span>
            <div class="cell-content hours-list">
              <div v-for="day in DAYS" :key="day" class="hours-entry">
                <div class="hours-row">
                  <span class="has-text-body-small hours-day">{{ $t(DAY_I18N_KEYS[day]) }}</span>
                  <span class="has-text-body-small">{{ parseTimeRange(day) }}</span>
                </div>
                <span
                  v-if="getExceptionText(day)"
                  class="has-text-body-extra-small hours-exception"
                >
                  * {{ getExceptionText(day) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Warning callout -->
      <div v-if="location.properties.optional_info_general" class="warning-callout">
        {{ translateWarning(location.properties.optional_info_general) }}
      </div>

      <span class="has-text-label-default">{{ $t('servicesAvailable') }}</span>

      <!-- New patient services -->
      <section v-if="newPatientServices.length" class="services-section">
        <span class="has-text-label-small cell-label">{{
          $t('patientType.patient_type_new')
        }}</span>
        <span class="has-text-body-extra-small">{{
          $t('patientType.patient_type_new_subtext')
        }}</span>
        <div class="service-list">
          <span v-for="label in newPatientServices" :key="label" class="has-text-body-small">
            {{ $t(label) }}
          </span>
        </div>
      </section>

      <!-- Existing patient only services -->
      <section v-if="existingOnlyServices.length" class="services-section">
        <span class="has-text-label-small cell-label">{{
          $t('patientType.patient_type_existing_only')
        }}</span>
        <span class="has-text-body-extra-small">{{
          $t('patientType.patient_type_existing_only_subtext')
        }}</span>
        <div class="service-list">
          <span v-for="label in existingOnlyServices" :key="label" class="has-text-body-small">
            {{ $t(label) }}
          </span>
        </div>
      </section>

      <!-- Tests -->
      <section v-if="tests.length" class="services-section">
        <span class="has-text-label-small cell-label">{{ $t('tests.category') }}</span>
        <div class="service-list">
          <span v-for="test in tests" :key="test" class="has-text-body-small">{{
            $t(test.replace('_', '.'))
          }}</span>
        </div>
      </section>

      <!-- Sliding scale -->
      <section class="services-section">
        <span class="has-text-label-small cell-label">{{ $t('slidingScale') }}</span>
        <span class="has-text-body-small">{{ $t('slidingScaleExplanation') }}</span>
        <span class="has-text-body-small">{{
          location.properties.sliding_scale ?? $t('slidingScaleNull')
        }}</span>
      </section>
    </div>
  </div>
</template>

<style scoped>
.location-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  container-type: inline-size;
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
  line-height: 1.4;
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
  color: var(--Schemes-On-Surface-High);
}

.detail-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
}

@media (max-width: 768px), (max-width: 1064px) and (max-height: 600px) {
  .detail-columns {
    grid-template-columns: 1fr;
  }
}

@container (max-width: 500px) {
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
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cell-label {
  color: var(--Schemes-On-Surface-Low);
}

.cell-content {
}

.cell-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.hours-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-s);
}

.hours-row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.hours-day {
  color: var(--Schemes-On-Surface-Low);
}

.hours-exception {
  display: block;
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

.service-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xs);
}
</style>
