// ABOUTME: Fetches and posts comments on an issue's Activity thread via
// ABOUTME: /private/key/issues/:id/comments — used by ReportDetailContent's Activity panel.
import { ref } from 'vue'
import { useAuth } from '@phila/sso-vue'
import { api311Fetch } from './api311'
import { parseError } from './useApiError'
import type { Comment } from '@/types/api'

const GENERIC_LOAD_ERROR = 'Something went wrong loading activity for this report.'
const GENERIC_POST_ERROR = 'Something went wrong posting your comment.'

export function useComments() {
  const auth = useAuth()
  const comments = ref<Comment[]>([])
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const isPosting = ref(false)
  const postError = ref<string | null>(null)

  async function load(issueId: string): Promise<void> {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await api311Fetch({ path: `/private/key/issues/${issueId}/comments`, auth })
      if (!res.ok) throw await parseError(res)
      const body = (await res.json()) as { comments?: Comment[] }
      comments.value = body.comments ?? []
    } catch (e) {
      errorMessage.value = e instanceof Error ? e.message : GENERIC_LOAD_ERROR
    } finally {
      isLoading.value = false
    }
  }

  async function post(issueId: string, content: string, imgB64?: string): Promise<boolean> {
    isPosting.value = true
    postError.value = null
    try {
      const body: { content: string; imgB64?: string } = { content }
      if (imgB64) body.imgB64 = imgB64
      const res = await api311Fetch({
        path: `/private/key/issues/${issueId}/comments`,
        method: 'POST',
        body,
        auth,
      })
      if (!res.ok) throw await parseError(res)
      const comment = (await res.json()) as Comment
      comments.value = [...comments.value, comment]
      return true
    } catch (e) {
      postError.value = e instanceof Error ? e.message : GENERIC_POST_ERROR
      return false
    } finally {
      isPosting.value = false
    }
  }

  return { comments, isLoading, errorMessage, isPosting, postError, load, post }
}
