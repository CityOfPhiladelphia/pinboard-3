// ABOUTME: Tests for parseCommentContent — splitting a leading attached-image URL
// ABOUTME: line off of a comment's content, matching 311-mobile-app Android's rules.
import { describe, it, expect } from 'vitest'
import { parseCommentContent } from '../commentContent'

describe('parseCommentContent', () => {
  it('splits a leading image URL onto its own field, and trims the newline off the body', () => {
    const result = parseCommentContent(
      'https://cdn.test/comments/abc123.jpg\nThanks, we sent a crew out.',
    )
    expect(result.imageUrl).toBe('https://cdn.test/comments/abc123.jpg')
    expect(result.body).toBe('Thanks, we sent a crew out.')
  })

  it('recognizes jpeg and png extensions too', () => {
    expect(parseCommentContent('https://cdn.test/a.jpeg\nBody').imageUrl).toBe(
      'https://cdn.test/a.jpeg',
    )
    expect(parseCommentContent('https://cdn.test/a.png\nBody').imageUrl).toBe(
      'https://cdn.test/a.png',
    )
  })

  it('ignores a query string or fragment when checking the extension', () => {
    const result = parseCommentContent('https://cdn.test/a.jpg?w=200#preview\nBody')
    expect(result.imageUrl).toBe('https://cdn.test/a.jpg?w=200#preview')
    expect(result.body).toBe('Body')
  })

  it('returns the content unchanged as body when there is no leading image URL', () => {
    const result = parseCommentContent('Just a plain comment.')
    expect(result.imageUrl).toBeNull()
    expect(result.body).toBe('Just a plain comment.')
  })

  it('does not treat a first line that merely looks like a URL, but is not an image, as one', () => {
    const result = parseCommentContent('https://311.phila.gov/status\nCheck this out')
    expect(result.imageUrl).toBeNull()
    expect(result.body).toBe('https://311.phila.gov/status\nCheck this out')
  })

  it('handles an image-only comment (no body text after the URL)', () => {
    const result = parseCommentContent('https://cdn.test/a.jpg')
    expect(result.imageUrl).toBe('https://cdn.test/a.jpg')
    expect(result.body).toBe('')
  })

  it('does not mistake a relative or scheme-less first line for an image URL', () => {
    const result = parseCommentContent('a.jpg looks like a filename\nBody')
    expect(result.imageUrl).toBeNull()
  })
})
