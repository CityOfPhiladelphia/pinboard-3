// ABOUTME: Lets a wizard step intercept the shell's Back/Next controls.
// ABOUTME: A handler returns true when it consumed the event (e.g. moved
// ABOUTME: between sub-screens); false lets the shell change routes.
import { inject, onBeforeUnmount, type Ref } from 'vue'

export const WIZARD_NAV_KEY = 'wizard:nav'

export interface WizardNavHandlers {
  next(): boolean
  back(): boolean
}

export function useWizardNav(handlers: WizardNavHandlers): void {
  const nav = inject<Ref<WizardNavHandlers | null> | undefined>(WIZARD_NAV_KEY, undefined)
  if (!nav) return
  nav.value = handlers
  onBeforeUnmount(() => {
    nav.value = null
  })
}
