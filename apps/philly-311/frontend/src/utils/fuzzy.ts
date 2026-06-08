// ABOUTME: Tiny fuzzy matcher used by CategorySearch to rank service types.
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

export interface FuzzyMatchInput<T> {
  item: T
  title: string
  keywords?: string[]
}

export function fuzzyMatch<T>(query: string, inputs: FuzzyMatchInput<T>[]): T[] {
  if (!query.trim()) return []
  const scored = inputs
    .map(({ item, title, keywords }) => ({
      item,
      score: fuzzyScore(query, title, keywords ?? []),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored.map((s) => s.item)
}
