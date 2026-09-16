// ABOUTME: Lets the wizard's last step (Review) register a Submit action into
// ABOUTME: the shell's footer, in place of Next — mirrors useWizardValidity's
// ABOUTME: watch-and-mirror shape, but carries a label/disabled/click handler
// ABOUTME: instead of a single boolean.
import { inject, onBeforeUnmount, watch, type ComputedRef, type Ref } from 'vue'

export const WIZARD_SUBMIT_KEY = 'wizard:submit'

export interface WizardSubmitHandler {
  label: string
  disabled: boolean
  onSubmit(): void
}

export function useWizardSubmit(handler: ComputedRef<WizardSubmitHandler>): void {
  const submit = inject<Ref<WizardSubmitHandler | null> | undefined>(WIZARD_SUBMIT_KEY, undefined)
  if (!submit) return

  const stop = watch(handler, (h) => (submit.value = h), { immediate: true })

  onBeforeUnmount(() => {
    stop()
    submit.value = null
  })
}
