// ABOUTME: Tests for CommentCell — sender/verified-badge display, timestamp formatting,
// ABOUTME: and splitting a leading attached-image URL off the comment body.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CommentCell from '../CommentCell.vue'
import type { Comment } from '@/types/api'

const staffComment: Comment = {
  id: '1',
  content: 'Your request has been assigned to the Department of Streets',
  createdAt: '2026-08-25T13:21:00.000Z',
  updatedAt: '2026-08-25T13:21:00.000Z',
  private: false,
  creator: { id: 'c1', name: 'Department of Streets' },
}

const publicComment: Comment = {
  id: '2',
  content: 'I saw this issue too!',
  createdAt: '2026-08-25T19:55:00.000Z',
  updatedAt: '2026-08-25T19:55:00.000Z',
  private: false,
  creator: { id: 'c2', name: 'Philly311 App' },
}

describe('CommentCell', () => {
  it("shows the sender's real name and a verified badge for a staff/department reply", () => {
    const w = mount(CommentCell, { props: { comment: staffComment } })
    expect(w.text()).toContain('Department of Streets')
    expect(w.find('.comment-cell__verified-badge').exists()).toBe(true)
  })

  it('shows "Public user" with no verified badge for an anonymous/public commenter', () => {
    const w = mount(CommentCell, { props: { comment: publicComment } })
    expect(w.text()).toContain('Public user')
    expect(w.text()).not.toContain('Philly311 App')
    expect(w.find('.comment-cell__verified-badge').exists()).toBe(false)
  })

  it('renders the comment body', () => {
    const w = mount(CommentCell, { props: { comment: publicComment } })
    expect(w.find('.comment-cell__body').text()).toBe('I saw this issue too!')
  })

  it('formats the timestamp as "Mon D, H:MM AM/PM" in Eastern time', () => {
    const w = mount(CommentCell, { props: { comment: staffComment } })
    expect(w.find('.comment-cell__timestamp').text()).toBe('Aug 25, 9:21 AM')
  })

  it('splits a leading attached-image URL into a thumbnail, separate from the body text', () => {
    const withImage: Comment = {
      ...publicComment,
      content: 'https://cdn.test/comments/abc123.jpg\nHere is what it looks like now.',
    }
    const w = mount(CommentCell, { props: { comment: withImage } })
    const img = w.find('.comment-cell__image')
    expect(img.attributes('src')).toBe('https://cdn.test/comments/abc123.jpg')
    expect(w.find('.comment-cell__body').text()).toBe('Here is what it looks like now.')
  })

  it('renders no image element and no empty body when there is neither', () => {
    const empty: Comment = { ...publicComment, content: '' }
    const w = mount(CommentCell, { props: { comment: empty } })
    expect(w.find('.comment-cell__image').exists()).toBe(false)
    expect(w.find('.comment-cell__body').exists()).toBe(false)
  })
})
