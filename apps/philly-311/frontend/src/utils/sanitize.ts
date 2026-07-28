// ABOUTME: HTML sanitizer wrapper for knowledge-article bodies.
// ABOUTME: Drops scripts/iframes/forms; preserves links with rel="noopener".
import DOMPurify from 'dompurify'

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if ('href' in node && (node as HTMLAnchorElement).href) {
    const a = node as HTMLAnchorElement
    a.setAttribute('rel', 'noopener')
    a.setAttribute('target', '_blank')
  }
})

export function sanitize(html: string): string {
  // Don't combine USE_PROFILES with explicit ALLOWED_TAGS/ATTR — the profile
  // adds back attrs we don't want (notably `style`). Stick to the explicit lists.
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'a',
      'p',
      'strong',
      'em',
      'ul',
      'ol',
      'li',
      'br',
      'h2',
      'h3',
      'h4',
      'blockquote',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'rel', 'target', 'title'],
  })
}
