// ABOUTME: Wizard step validity binding. A step calls this once with a
// ABOUTME: computed boolean; the composable mirrors it into the wizard's
// ABOUTME: shared canAdvance ref, clears showErrors once validity turns
// ABOUTME: true, and resets both to their defaults before unmount so the
// ABOUTME: incoming step's setup runs after the reset, not before it.
import { inject, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue'

export const WIZARD_CAN_ADVANCE_KEY = 'wizard:canAdvance'
export const WIZARD_SHOW_ERRORS_KEY = 'wizard:showErrors'

/** Read the wizard's "surface validation errors now" flag (set when Next is pressed while invalid). */
export function useWizardErrors(): Ref<boolean> {
  return inject<Ref<boolean>>(WIZARD_SHOW_ERRORS_KEY, ref(false))
}

export function useWizardValidity(validity: ComputedRef<boolean>): void {
  const canAdvance = inject<Ref<boolean> | undefined>(WIZARD_CAN_ADVANCE_KEY, undefined)
  const showErrors = inject<Ref<boolean> | undefined>(WIZARD_SHOW_ERRORS_KEY, undefined)
  if (!canAdvance) return

  const stop = watch(
    validity,
    (v) => {
      canAdvance.value = v
      if (v && showErrors) showErrors.value = false
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    stop()
    canAdvance.value = true
    if (showErrors) showErrors.value = false
  })
}
