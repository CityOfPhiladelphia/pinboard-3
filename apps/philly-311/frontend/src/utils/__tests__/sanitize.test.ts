// ABOUTME: Tests for the HTML sanitizer — verifies script stripping, link attribute
// ABOUTME: injection (rel/target), and removal of dangerous attributes.
import { describe, it, expect } from 'vitest'
import { sanitize } from '../sanitize'

describe('sanitize', () => {
  it('strips script tags, keeping safe content', () => {
    const result = sanitize('<script>alert(1)</script><p>ok</p>')
    expect(result).toBe('<p>ok</p>')
    expect(result).not.toContain('<script')
  })

  it('adds rel="noopener" to anchor tags', () => {
    const result = sanitize('<a href="https://example.com">x</a>')
    expect(result).toContain('rel="noopener"')
  })

  it('adds target="_blank" to anchor tags', () => {
    const result = sanitize('<a href="https://example.com">x</a>')
    expect(result).toContain('target="_blank"')
  })

  it('preserves the anchor text and href', () => {
    const result = sanitize('<a href="https://example.com">click here</a>')
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('click here')
  })

  it('strips style attributes', () => {
    const result = sanitize('<p style="color:red">text</p>')
    expect(result).not.toContain('style=')
    expect(result).toContain('<p>text</p>')
  })

  it('strips onclick and other event handlers', () => {
    const result = sanitize('<p onclick="evil()">text</p>')
    expect(result).not.toContain('onclick')
    expect(result).toContain('<p>text</p>')
  })

  it('strips iframe tags', () => {
    const result = sanitize('<iframe src="https://evil.com"></iframe><p>safe</p>')
    expect(result).not.toContain('<iframe')
    expect(result).toContain('<p>safe</p>')
  })

  it('preserves allowed block elements', () => {
    const input = '<h2>Title</h2><p>Body</p><ul><li>Item</li></ul>'
    const result = sanitize(input)
    expect(result).toContain('<h2>Title</h2>')
    expect(result).toContain('<p>Body</p>')
    expect(result).toContain('<ul><li>Item</li></ul>')
  })

  it('preserves images with their src and alt', () => {
    const result = sanitize('<img src="https://example.com/photo.jpg" alt="A photo">')
    expect(result).toBe('<img src="https://example.com/photo.jpg" alt="A photo">')
  })

  it('strips javascript: URIs from an image src', () => {
    const result = sanitize('<img src="javascript:alert(1)" alt="x">')
    expect(result).not.toContain('javascript:')
  })

  it('preserves tables, and formatting divs/spans', () => {
    const input =
      '<table><thead><tr><th>Fee</th></tr></thead><tbody><tr><td>$5</td></tr></tbody></table>' +
      '<div><span>note</span></div>'
    const result = sanitize(input)
    expect(result).toBe(
      '<table><thead><tr><th>Fee</th></tr></thead><tbody><tr><td>$5</td></tr></tbody></table>' +
        '<div><span>note</span></div>',
    )
  })
})
