// ABOUTME: Tiny fuzzy scorer used to rank service types in the type directory.
// ABOUTME: Scores: exact > word-prefix > substring > keyword-prefix > keyword-substring > 0.

export function fuzzyScore(query: string, title: string, keywords: string[] = []): number {
  if (!query) return 0
  const q = query.toLowerCase().trim()
  if (!q) return 0
  const t = title.toLowerCase()
  if (t === q) return 100
  const titleWords = t.split(/\s+/)
  if (titleWords.some((w) => w.startsWith(q))) return 80
  if (t.includes(q)) return 60
  for (const k of keywords) {
    const kw = k.toLowerCase()
    if (kw.startsWith(q)) return 40
    if (kw.includes(q)) return 20
  }
  return 0
}
