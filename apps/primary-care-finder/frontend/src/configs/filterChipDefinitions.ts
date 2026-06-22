import { faArrowUpArrowDown } from '@fortawesome/pro-solid-svg-icons/faArrowUpArrowDown'
import type { FilterDefinition } from '@pinboard/ui'

export const filterDefinitions: FilterDefinition[] = [
  {
    key: 'sort',
    label: 'Sort',
    multiple: false,
    excludeFromCount: true,
    iconDefinition: faArrowUpArrowDown,
    // TODO(teammate): finalize sort options + ordering logic.
    choices: [
      { text: 'Distance', value: 'distance' },
      { text: 'Name (A–Z)', value: 'name' },
    ],
  },
  {
    key: 'ageGroup',
    label: 'Age Group',
    multiple: true,
    choices: [
      { text: 'Adult', value: 'adult' },
      { text: 'Children', value: 'children' },
    ],
  },
  {
    key: 'waitTime',
    label: 'Wait time (Primary Care)',
    multiple: true,
    choices: [
      { text: 'Same day or walk in', value: 'sameDay' },
      { text: '<1 week (well visit)', value: 'weekWell' },
      { text: '<1 week (sick visit)', value: 'weekSick' },
      { text: '<2 months (all primary care)', value: 'twoMonths' },
    ],
  },
  {
    key: 'visitType',
    label: 'Primary care',
    multiple: true,
    choices: [
      { text: 'Well visit', value: 'primaryWell' },
      { text: 'Sick visit', value: 'primarySick' },
      { text: 'Sports physicals', value: 'primarySports' },
      { text: 'Prenatal care', value: 'primaryPrenatal' },
      { text: "Women's health", value: 'primaryWomen' },
      { text: 'Telehealth', value: 'primaryTelehealth' },
      { text: 'Vaccines', value: 'primaryVaccines' },
    ],
  },
  {
    key: 'specialty',
    label: 'Speciality services',
    multiple: true,
    choices: [
      { text: 'Mental health', value: 'mental' },
      { text: 'Dental', value: 'dental' },
      { text: 'Eye care', value: 'eye' },
      { text: 'Podiatry', value: 'podiatry' },
      { text: 'MAT', value: 'mat' },
      { text: 'Nutrition', value: 'nutrition' },
      { text: 'Tobacco cessation', value: 'tobacco' },
      { text: 'Pharmacy', value: 'pharmacy' },
    ],
  },
  {
    key: 'tests',
    label: 'Tests and imaging',
    multiple: true,
    choices: [
      { text: 'Blood', value: 'blood' },
      { text: 'STI', value: 'sti' },
      { text: 'COVID', value: 'covid' },
      { text: 'Mammography', value: 'mammo' },
      { text: 'X-ray', value: 'xray' },
    ],
  },
  {
    key: 'languages',
    label: 'Languages spoken by staff',
    multiple: true,
    // TODO(teammate): replace with real `language` field values.
    choices: [
      { text: 'Spanish', value: 'spanish' },
      { text: 'Mandarin', value: 'mandarin' },
      { text: 'Vietnamese', value: 'vietnamese' },
    ],
  },
]
