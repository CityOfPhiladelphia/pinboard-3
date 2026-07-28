// ABOUTME: Tests the conditional question evaluator.
import { describe, expect, it } from 'vitest'
import { visibleQuestions } from '../conditional'
import type { QuestionField } from '@/types/api'

const baseA: QuestionField = {
  field: 'A',
  label: 'A',
  type: 'picklist',
  required: false,
  options: ['Yes', 'No'],
}
const baseB = (): QuestionField => ({
  field: 'B',
  label: 'B',
  type: 'picklist',
  required: false,
  options: ['Yes', 'No'],
  controllerName: 'Service_Request_Type__c',
  dependentValues: { Yes: ['Pothole Repair'], No: ['Pothole Repair'] },
})

describe('visibleQuestions', () => {
  it('returns all questions when no controllerName is set', () => {
    expect(visibleQuestions([baseA], {}, 'Pothole Repair')).toEqual([baseA])
  })

  it('hides a dependent question when the controller value does not match', () => {
    const result = visibleQuestions([baseA, baseB()], { A: 'Yes' }, 'Streetlight Outage')
    expect(result.map((q) => q.field)).toEqual(['A'])
  })

  it('shows a dependent question when the controller value matches a dependentValues list', () => {
    const result = visibleQuestions([baseA, baseB()], { A: 'Yes' }, 'Pothole Repair')
    expect(result.map((q) => q.field)).toEqual(['A', 'B'])
  })

  it('hides a dependent question when no answer for the controller exists', () => {
    const dependentOnA: QuestionField = {
      field: 'C',
      label: 'C',
      type: 'string',
      required: false,
      controllerName: 'A',
      dependentValues: { '': ['Yes'] }, // dependentValues key does not matter here; controller value missing
    }
    const result = visibleQuestions([baseA, dependentOnA], {}, 'Pothole Repair')
    expect(result.map((q) => q.field)).toEqual(['A'])
  })

  it('falls back to "all visible" for dependent questions missing dependentValues metadata', () => {
    const partial: QuestionField = {
      field: 'D',
      label: 'D',
      type: 'string',
      required: false,
      controllerName: 'A',
      // dependentValues intentionally omitted
    }
    const result = visibleQuestions([baseA, partial], { A: 'Yes' }, 'Pothole Repair')
    // D is visible because dependentValues isn't there to filter it.
    expect(result.map((q) => q.field)).toEqual(['A', 'D'])
  })

  it('uses Service_Request_Type__c as the controller when controllerName matches it', () => {
    const result = visibleQuestions([baseB()], {}, 'Pothole Repair')
    expect(result).toHaveLength(1)
    const result2 = visibleQuestions([baseB()], {}, 'Streetlight Outage')
    expect(result2).toHaveLength(0)
  })
})
