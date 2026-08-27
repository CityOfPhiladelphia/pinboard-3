// ABOUTME: Fetches a single issue (with customFields) from /private/key/issues/:id
// ABOUTME: and posts upvotes to /private/key/issues/:id/upvote — used wherever the
// ABOUTME: full report-details view is shown (map/my-requests panel, confirmation page).
import { ref } from 'vue'
import { useAuth } from '@phila/sso-vue'
import { api311Fetch } from './api311'
import { parseError } from './useApiError'
import type { Issue } from '@/types/api'

const GENERIC_LOAD_ERROR = 'Something went wrong loading this report.'
const GENERIC_UPVOTE_ERROR = 'Something went wrong upvoting this report.'

export function useIssue() {
  const auth = useAuth()
  const issue = ref<Issue | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const isUpvoting = ref(false)
  const upvoteError = ref<string | null>(null)

  async function load(id: string): Promise<void> {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await api311Fetch({ path: `/private/key/issues/${id}`, auth })
      if (!res.ok) throw await parseError(res)
      issue.value = (await res.json()) as Issue
    } catch (e) {
      errorMessage.value = e instanceof Error ? e.message : GENERIC_LOAD_ERROR
    } finally {
      isLoading.value = false
    }
  }

  /** Returns whether the upvote succeeded, so callers can keep a confirmation dialog open on failure. */
  async function upvote(id: string, description: string): Promise<boolean> {
    isUpvoting.value = true
    upvoteError.value = null
    try {
      const res = await api311Fetch({
        path: `/private/key/issues/${id}/upvote`,
        method: 'POST',
        body: { description },
        auth,
      })
      if (!res.ok) throw await parseError(res)
      issue.value = (await res.json()) as Issue
      return true
    } catch (e) {
      upvoteError.value = e instanceof Error ? e.message : GENERIC_UPVOTE_ERROR
      return false
    } finally {
      isUpvoting.value = false
    }
  }

  return { issue, isLoading, errorMessage, isUpvoting, upvoteError, load, upvote }
}
