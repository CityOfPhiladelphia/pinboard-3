// ABOUTME: Calls GET /private/key/me once per sign-in so the backend can get-or-create
// ABOUTME: the Salesforce Contact a signed-in user's submit/me-issues calls require.
import { ref, watch } from 'vue'
import { useAuth } from '@phila/sso-vue'
import { api311Fetch } from './api311'
import { parseError } from './useApiError'

export type AccountProvisioningStatus = 'idle' | 'pending' | 'ready' | 'error'

export function useAccountProvisioning() {
  const auth = useAuth()
  const status = ref<AccountProvisioningStatus>('idle')
  const errorMessage = ref<string | null>(null)

  // Bumped on every sign-in/out so a slow-resolving request from a previous
  // auth state can't overwrite the status set by a subsequent one.
  let requestId = 0

  async function provision(): Promise<void> {
    const id = ++requestId
    status.value = 'pending'
    errorMessage.value = null
    try {
      const response = await api311Fetch({ path: '/private/key/me', auth })
      if (!response.ok) throw await parseError(response)
      if (id === requestId) status.value = 'ready'
    } catch (e) {
      if (id !== requestId) return
      errorMessage.value =
        e instanceof Error ? e.message : 'Something went wrong setting up your account.'
      status.value = 'error'
    }
  }

  watch(
    auth.isAuthenticated,
    (signedIn) => {
      if (signedIn) {
        provision()
      } else {
        requestId++
        status.value = 'idle'
        errorMessage.value = null
      }
    },
    { immediate: true },
  )

  return { status, errorMessage, retry: provision }
}
