<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PrimaryCareField, PrimaryCareLocation } from '@/types'
import { PhilaButton } from '@phila/phila-ui-button'
import { PhilaLink, Icon } from '@pinboard/ui'
import LocationTags from './LocationTags.vue'
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

// Age groups served — mirrors the age-group filter (adults/children === 'Yes').
const ageGroupServed = computed<string | null>(() => {
  const servesAdults = p.value.adults === 'Yes'
  const servesChildren = p.value.children === 'Yes'
  if (servesAdults && servesChildren) return t('ageRange.servesBoth')
  if (servesAdults) return t('ageRange.servesAdults')
  if (servesChildren) return t('ageRange.servesChildren')
  return null
})

// One flowing line: the age groups served, then the caveat, as a single sentence.
const patientsServedText = computed<string>(() => {
  const parts: string[] = []
  if (ageGroupServed.value) parts.push(ageGroupServed.value)
  if (p.value.caveat_ad_ch) parts.push(translateCaveat(p.value.caveat_ad_ch))
  return parts.join(' ')
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
    const exc = props.location.properties[`hours_${day}_exceptions`] as string | null
    if (exc) result[day] = exc
  }
  return result
})

function parseTime(raw: string | null): string {
  if (!raw) return ''
  const [hStr, mStr] = raw.split(':')
  let h = parseInt(hStr)
  const ampm = h >= 12 ? 'p.m.' : 'a.m.'
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

function translateCaveat(caveat: string): string {
  const msgs = messages.value[locale.value] as Record<string, Record<string, string>>
  return msgs?.caveats?.[caveat] ?? caveat
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
      <span class="has-text-label-large">{{ $t('locationDetails') }}</span>

      <!-- Contact: phone, website, address — icon + value, no headers -->
      <div class="detail-columns detail-zone">
        <div class="detail-col-left">
          <div v-if="p.med_phone_num" class="icon-row">
            <Icon :icon="IconPhone" inline decorative class="row-icon" />
            <PhilaLink :href="`tel:${p.med_phone_num}`" size="small">
              {{ p.med_phone_num }}
            </PhilaLink>
          </div>
          <div v-if="p.url_appt" class="icon-row">
            <Icon :icon="IconGlobe" inline decorative class="row-icon" />
            <PhilaLink :href="p.url_appt" size="small" target="_blank" rel="noopener noreferrer">
              {{ $t('providerWebsite') }}
            </PhilaLink>
          </div>
        </div>
        <div class="detail-col-right">
          <div class="icon-row">
            <Icon :icon="IconLocationDot" inline decorative class="row-icon" />
            <PhilaLink :href="mapsUrl()" size="small" target="_blank" rel="noopener noreferrer">
              {{ fullAddress }}
            </PhilaLink>
          </div>
        </div>
      </div>

      <!-- Languages spoken + transit options — icon + header + content -->
      <div class="detail-columns detail-zone detail-zone--divided">
        <div class="detail-col-left">
          <div v-if="languagesSpoken.length" class="detail-cell">
            <div class="cell-header">
              <Icon :icon="IconLanguage" inline decorative class="row-icon" />
              <span class="has-text-label-small cell-label">{{ $t('languagesSpoken') }}</span>
            </div>
            <span class="has-text-body-small">
              {{ languagesSpoken.map(translateLanguage).join(', ') }}
            </span>
          </div>
        </div>
        <div class="detail-col-right">
          <div v-if="hasTransit" class="detail-cell">
            <div class="cell-header">
              <Icon :icon="IconBus" inline decorative class="row-icon" />
              <span class="has-text-label-small cell-label">{{ $t('transitOptions') }}</span>
            </div>
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
              <span v-if="location.properties.transport_parking " class="has-text-body-small">
                {{ $t('transit.car.label') }}:
                {{ translateTransitList(location.properties.transport_parking, 'car') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Hours — full width -->
      <div class="detail-cell detail-zone detail-zone--divided">
        <div class="cell-header">
          <Icon :icon="IconClock" inline decorative class="row-icon" />
          <span class="has-text-label-small cell-label">{{ $t('hours') }}</span>
        </div>
        <div class="cell-content hours-list">
          <div v-for="day in DAYS" :key="day" class="hours-entry">
            <div class="hours-row">
              <span class="has-text-body-small hours-day">{{ $t(DAY_I18N_KEYS[day]) }}</span>
              <span class="has-text-body-small">{{ parseTimeRange(day) }}</span>
            </div>
            <span v-if="getExceptionText(day)" class="has-text-body-extra-small hours-exception">
              * {{ getExceptionText(day) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Warning callout -->
      <div v-if="location.properties.optional_info_general" class="warning-callout">
        {{ translateWarning(location.properties.optional_info_general) }}
      </div>

      <span class="has-text-label-large detail-zone--divided">{{ $t('servicesAvailable') }}</span>

      <!-- Patients served -->
      <section v-if="patientsServedText" class="services-section">
        <span class="has-text-label-small cell-label">{{ $t('patientsServed') }}</span>
        <span class="has-text-body-small">{{ patientsServedText }}</span>
      </section>

      <!-- New patient services -->
      <section v-if="newPatientServices.length" class="services-section">
        <span class="has-text-label-small cell-label">{{
          $t('patientType.patient_type_new')
        }}</span>
        <span class="has-text-body-small">{{ $t('patientType.patient_type_new_subtext') }}</span>
        <ul class="service-list">
          <li v-for="label in newPatientServices" :key="label" class="has-text-body-small">
            {{ $t(label) }}
          </li>
        </ul>
      </section>

      <!-- Existing patient only services -->
      <section v-if="existingOnlyServices.length" class="services-section">
        <span class="has-text-label-small cell-label">{{
          $t('patientType.patient_type_existing_only')
        }}</span>
        <span class="has-text-body-small">{{
          $t('patientType.patient_type_existing_only_subtext')
        }}</span>
        <ul class="service-list">
          <li v-for="label in existingOnlyServices" :key="label" class="has-text-body-small">
            {{ $t(label) }}
          </li>
        </ul>
      </section>

      <!-- Tests -->
      <section v-if="tests.length" class="services-section">
        <span class="has-text-label-small cell-label">{{ $t('tests.category') }}</span>
        <ul class="service-list">
          <li v-for="test in tests" :key="test" class="has-text-body-small">
            {{ $t(test.replace('_', '.')) }}
          </li>
        </ul>
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
  gap: 0.5rem;
}

/* Indent the data under the section header so it lines up past the header icon. */
.detail-cell > :not(.cell-header) {
  padding-left: calc(var(--Label-Default-font-label-default-size) + 0.5rem);
}

/* Contact section: an icon next to the value (phone, website, address), no header. */
.icon-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

/* Languages / transit / hours: an icon next to the section header. */
.cell-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.row-icon {
  flex-shrink: 0;
  font-size: 1rem;
}

.icon-row .row-icon {
  /* nudge down to sit on the first line of the value */
  margin-top: 0.15rem;
}

.cell-header .row-icon {
  font-size: var(--Label-Default-font-label-default-size);
}

/* Gray divider above the zones that follow the contact section. */
.detail-zone--divided {
  border-top: 1px solid var(--Schemes-Outline-Variant, rgba(0, 0, 0, 0.12));
  padding-top: 1.5rem;
}

/* Make the bold headers a step larger than the body text below them, so the
   hierarchy comes from larger headers rather than shrinking the content. */
.cell-label {
  color: var(--Schemes-On-Surface-High);
  font-size: var(--Label-Default-font-label-default-size) !important;
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

.hours-exception {
  display: block;
  /* Wrap before the time column instead of running the full width. */
  max-width: 65%;
}

.services-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border-top: 1px solid var(--Schemes-Outline-Variant, rgba(0, 0, 0, 0.12));
  padding-top: 1.5rem;
}

/* No divider above the first section — it sits right under the "Services
   available" heading. */
.services-section:first-of-type {
  border-top: none;
  padding-top: 0;
}

.warning-callout {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 0.75rem 1rem;
}

.service-list {
  margin: 0;
  padding-left: 1.5rem;
  list-style-type: disc;
}

/* Reset the global ul/li spacing (li gets a large margin-bottom by default). */
.service-list li {
  margin: 0;
  padding: 0;
}

.service-list li + li {
  margin-top: var(--spacing-xs);
}
</style>
