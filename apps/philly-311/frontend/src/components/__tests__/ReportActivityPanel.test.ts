// ABOUTME: Tests for ReportActivityPanel — the Activity sub-panel content: comment thread
// ABOUTME: (sort/verified-only filtering, load/error/empty states) plus the text+photo composer.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import ReportActivityPanel from '../ReportActivityPanel.vue'
import type { Comment, Issue } from '@/types/api'

const comments = ref<Comment[]>([])
const commentsLoading = ref(false)
const commentsError = ref<string | null>(null)
const isPosting = ref(false)
const postError = ref<string | null>(null)
const loadComments = vi.fn()
const postComment = vi.fn()
vi.mock('@/composables/useComments', () => ({
  useComments: () => ({
    comments,
    isLoading: commentsLoading,
    errorMessage: commentsError,
    isPosting,
    postError,
    load: loadComments,
    post: postComment,
  }),
}))

const resizeImageFileToDataURL = vi.fn()
vi.mock('@/utils/photo', () => ({
  resizeImageFileToDataURL: (...args: unknown[]) => resizeImageFileToDataURL(...args),
}))

// A lightweight stand-in for the real shell (covered on its own by the chassis's
// DetailSubpanel.test.ts) — just enough markup for this panel's own tests below.
vi.mock('@pinboard/ui', () => ({
  DetailSubpanel: defineComponent({
    name: 'DetailSubpanel',
    props: ['title', 'backLabel', 'onBack', 'onClose'],
    setup(props, { slots }) {
      return () =>
        h('div', { class: 'detail-subpanel' }, [
          h('h2', { class: 'detail-subpanel__title' }, props.title),
          h('div', { class: 'detail-subpanel__body' }, slots.default?.()),
          slots.footer ? h('div', { class: 'detail-subpanel__footer' }, slots.footer()) : null,
        ])
    },
  }),
}))

const baseIssue: Issue = {
  id: '12345678',
  caseNumber: '12345678',
  serviceType: 'Abandoned Vehicle',
  status: 'In Progress',
  address: '1234 Market St, 19107',
  description: 'A blue van has been parked here for weeks.',
  createdAt: '2026-07-01T13:14:00Z',
  slaDate: '2026-08-01',
}

const publicComment: Comment = {
  id: 'c1',
  content: 'I saw this issue too!',
  createdAt: '2026-08-25T19:55:00.000Z',
  updatedAt: '2026-08-25T19:55:00.000Z',
  private: false,
  creator: { id: 'u1', name: 'Philly311 App' },
}
const staffComment: Comment = {
  id: 'c2',
  content: 'A crew has been dispatched.',
  createdAt: '2026-08-26T13:00:00.000Z',
  updatedAt: '2026-08-26T13:00:00.000Z',
  private: false,
  creator: { id: 'u2', name: 'Department of Streets' },
}

beforeEach(() => {
  comments.value = []
  commentsLoading.value = false
  commentsError.value = null
  isPosting.value = false
  postError.value = null
  loadComments.mockReset()
  postComment.mockReset()
  resizeImageFileToDataURL.mockReset()
})

function mountPanel(report: Issue = baseIssue) {
  return mount(ReportActivityPanel, { props: { report, onBack: vi.fn() } })
}

describe('ReportActivityPanel', () => {
  it('loads comments for the report on mount', () => {
    mountPanel()
    expect(loadComments).toHaveBeenCalledWith('12345678')
  })

  it("tints the avatar placeholder with the service type's color when there is no photo", () => {
    const w = mountPanel()
    const avatar = w.find('.activity-panel__avatar')
    expect(avatar.find('img').exists()).toBe(false)
    expect(avatar.attributes('style')).toContain('background-color')
  })

  it('shows the photo instead of the tint when the report has one', () => {
    const w = mountPanel({ ...baseIssue, mediaUrl: 'https://cdn.test/p.jpg' })
    const avatar = w.find('.activity-panel__avatar')
    expect(avatar.find('img').attributes('src')).toBe('https://cdn.test/p.jpg')
    expect(avatar.attributes('style')).toBeUndefined()
  })

  it('shows a loading state while comments are being fetched', () => {
    commentsLoading.value = true
    const w = mountPanel()
    expect(w.text()).toContain('Loading activity…')
  })

  it('shows the load error when fetching comments fails', () => {
    commentsError.value = 'Something went wrong loading activity for this report.'
    const w = mountPanel()
    const status = w.find('[role="alert"]')
    expect(status.text()).toBe('Something went wrong loading activity for this report.')
  })

  it('shows an empty state and hides the filter chips when there are no comments', () => {
    const w = mountPanel()
    expect(w.text()).toContain('No comments yet.')
    expect(w.find('.filter-chip').exists()).toBe(false)
  })

  it('renders comments newest-first by default, and re-sorts oldest-first on demand', async () => {
    comments.value = [publicComment, staffComment]
    const w = mountPanel()

    const cellText = () => w.findAll('.comment-cell').map((c) => c.text())
    expect(cellText()[0]).toContain('A crew has been dispatched.')
    expect(cellText()[1]).toContain('I saw this issue too!')

    await w.find('[data-choice="oldest"]').trigger('click')
    expect(cellText()[0]).toContain('I saw this issue too!')
    expect(cellText()[1]).toContain('A crew has been dispatched.')
  })

  it("doesn't show the Sort chip as selected until the user actually picks an option", async () => {
    comments.value = [publicComment, staffComment]
    const w = mountPanel()

    expect(w.find('[data-choice="newest"]').attributes('aria-pressed')).toBe('false')
    expect(w.find('[data-choice="oldest"]').attributes('aria-pressed')).toBe('false')

    await w.find('[data-choice="oldest"]').trigger('click')
    expect(w.find('[data-choice="oldest"]').attributes('aria-pressed')).toBe('true')
  })

  it('resetting the Sort dropdown clears the chip back to unselected and re-sorts newest-first', async () => {
    comments.value = [publicComment, staffComment]
    const w = mountPanel()
    await w.find('[data-choice="oldest"]').trigger('click')
    expect(w.find('[data-choice="oldest"]').attributes('aria-pressed')).toBe('true')

    await w.find('[data-choice-reset]').trigger('click')
    expect(w.find('[data-choice="newest"]').attributes('aria-pressed')).toBe('false')
    expect(w.find('[data-choice="oldest"]').attributes('aria-pressed')).toBe('false')
    const cellText = () => w.findAll('.comment-cell').map((c) => c.text())
    expect(cellText()[0]).toContain('A crew has been dispatched.')
  })

  it('filters to verified-only comments, with its own empty state', async () => {
    comments.value = [publicComment]
    const w = mountPanel()

    await w.find('button.filter-chip').trigger('click')
    expect(w.text()).toContain('No verified comments.')
    expect(w.find('.comment-cell').exists()).toBe(false)
  })

  it('disables the send button until there is comment text, and posts on click', async () => {
    const w = mountPanel()

    const send = w.find('[data-test="activity-send"]')
    expect(send.attributes('disabled')).toBeDefined()

    await w.find('textarea').setValue('Still an issue.')
    expect(send.attributes('disabled')).toBeUndefined()

    postComment.mockResolvedValue(true)
    await send.trigger('click')
    await flushPromises()
    expect(postComment).toHaveBeenCalledWith('12345678', 'Still an issue.', undefined)
  })

  async function attachPhoto(w: ReturnType<typeof mountPanel>) {
    const file = new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' })
    const input = w.find('.activity-panel__photo-input')
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await flushPromises()
  }

  it('attaches a photo, previews it, and lets it be removed before posting', async () => {
    resizeImageFileToDataURL.mockResolvedValue('data:image/jpeg;base64,RESIZED')
    const w = mountPanel()

    await attachPhoto(w)
    expect(w.find('.activity-panel__photo-preview img').attributes('src')).toBe(
      'data:image/jpeg;base64,RESIZED',
    )

    await w.find('[aria-label="Remove photo"]').trigger('click')
    expect(w.find('.activity-panel__photo-preview').exists()).toBe(false)
  })

  it('includes the attached photo when posting the comment', async () => {
    resizeImageFileToDataURL.mockResolvedValue('data:image/jpeg;base64,RESIZED')
    postComment.mockResolvedValue(true)
    const w = mountPanel()

    await attachPhoto(w)
    await w.find('textarea').setValue('See attached.')
    await w.find('[data-test="activity-send"]').trigger('click')
    await flushPromises()
    expect(postComment).toHaveBeenCalledWith(
      '12345678',
      'See attached.',
      'data:image/jpeg;base64,RESIZED',
    )
    // A successful post resets the composer, including the photo preview.
    expect(w.find('.activity-panel__photo-preview').exists()).toBe(false)
  })

  it('clears the composer on a successful post, and keeps the draft with postError on failure', async () => {
    const w = mountPanel()

    postComment.mockResolvedValueOnce(false)
    postError.value = 'Something went wrong posting your comment.'
    await w.find('textarea').setValue('Still an issue.')
    await w.find('[data-test="activity-send"]').trigger('click')
    await flushPromises()
    expect(w.text()).toContain('Something went wrong posting your comment.')
    expect((w.find('textarea').element as HTMLTextAreaElement).value).toBe('Still an issue.')

    postComment.mockResolvedValueOnce(true)
    await w.find('[data-test="activity-send"]').trigger('click')
    await flushPromises()
    expect((w.find('textarea').element as HTMLTextAreaElement).value).toBe('')
  })
})
