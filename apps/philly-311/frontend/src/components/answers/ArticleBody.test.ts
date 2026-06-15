// ABOUTME: Tests for ArticleBody — sanitized HTML rendering of article bodies.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ArticleBody from './ArticleBody.vue'

describe('ArticleBody', () => {
  it('renders allowed HTML', () => {
    const w = mount(ArticleBody, { props: { html: '<p>hello <strong>world</strong></p>' } })
    expect(w.find('.article-body').html()).toContain('<strong>world</strong>')
  })

  it('strips script tags but keeps safe siblings', () => {
    const w = mount(ArticleBody, { props: { html: '<script>window.x = 1</script><p>safe</p>' } })
    expect(w.html()).not.toContain('script')
    expect(w.text()).toContain('safe')
  })

  it('rewrites links with noopener/_blank', () => {
    const w = mount(ArticleBody, { props: { html: '<a href="https://example.com">x</a>' } })
    const a = w.find('a')
    expect(a.attributes('rel')).toBe('noopener')
    expect(a.attributes('target')).toBe('_blank')
  })
})
