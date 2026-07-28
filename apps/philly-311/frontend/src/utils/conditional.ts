// ABOUTME: Pure function — given a list of QuestionFields and the current
// ABOUTME: customFields answers + the active service type, return the questions
// ABOUTME: that should currently be visible. Honors Salesforce dependency metadata.
import type { QuestionField } from '@/types/api'

export function visibleQuestions(
  questions: QuestionField[],
  answers: Record<string, string>,
  serviceType: string,
): QuestionField[] {
  return questions.filter((q) => {
    if (!q.controllerName) return true
    const ctrlValue =
      q.controllerName === 'Service_Request_Type__c' ? serviceType : answers[q.controllerName]
    if (!ctrlValue) return false
    if (!q.dependentValues) return true
    // For each option, check if its dependentValues list contains the controller value.
    // The question is visible if ANY option is enabled by the current controller value.
    return Object.values(q.dependentValues).some((vs) => vs.includes(ctrlValue))
  })
}
