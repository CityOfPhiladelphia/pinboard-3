// ABOUTME: Wizard step validity binding. A step calls this once with a
// ABOUTME: computed boolean; the composable mirrors it into the wizard's
// ABOUTME: shared canAdvance ref and resets to true before unmount so the
// ABOUTME: incoming step's setup runs after the reset, not before it.
import { inject, onBeforeUnmount, watch, type ComputedRef, type Ref } from 'vue'

export const WIZARD_CAN_ADVANCE_KEY = 'wizard:canAdvance'

export function useWizardValidity(validity: ComputedRef<boolean>): void {
  const canAdvance = inject<Ref<boolean> | undefined>(WIZARD_CAN_ADVANCE_KEY, undefined)
  if (!canAdvance) return

  const stop = watch(
    validity,
    (v) => {
      canAdvance.value = v
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    stop()
    canAdvance.value = true
  })
}
