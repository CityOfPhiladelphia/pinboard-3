// ABOUTME: A comment's attached image isn't a separate API field — the server embeds
// ABOUTME: its URL as the first line of `content`. Splits that back out for display,
// ABOUTME: mirroring 311-mobile-app Android's parsing (iOS defines the same logic but
// ABOUTME: doesn't actually use it when rendering a comment, so Android is the reference).

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png']
const URI_SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//

function leadingImageUrl(content: string): string | null {
  const firstLine = content.split('\n')[0]
  if (!URI_SCHEME.test(firstLine)) return null
  const extension = firstLine.split('.').pop()?.toLowerCase().split(/[?#]/)[0]
  if (!extension || !IMAGE_EXTENSIONS.includes(extension)) return null
  return firstLine
}

export interface ParsedCommentContent {
  imageUrl: string | null
  body: string
}

export function parseCommentContent(content: string): ParsedCommentContent {
  const imageUrl = leadingImageUrl(content)
  if (!imageUrl) return { imageUrl: null, body: content }
  return { imageUrl, body: content.slice(imageUrl.length).replace(/^\n/, '') }
}
