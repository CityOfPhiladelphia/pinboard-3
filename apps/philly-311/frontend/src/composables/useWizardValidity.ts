// ABOUTME: Wizard step validity binding. A step calls this once with a
// ABOUTME: computed boolean; the composable mirrors it into the wizard's
// ABOUTME: shared canAdvance ref and resets to true on unmount so the next
// ABOUTME: step starts from a clean default.
import { inject, onUnmounted, watch, type ComputedRef, type Ref } from 'vue'

const KEY = 'wizard:canAdvance'

export function useWizardValidity(validity: ComputedRef<boolean>): void {
  const canAdvance = inject<Ref<boolean> | undefined>(KEY, undefined)
  if (!canAdvance) return

  const stop = watch(
    validity,
    (v) => {
      canAdvance.value = v
    },
    { immediate: true },
  )

  onUnmounted(() => {
    stop()
    canAdvance.value = true
  })
}
