// ABOUTME: Format an ISO timestamp as the report-card date line, e.g. "10/10/26 · 10:41 AM".
// ABOUTME: Returns null for missing/invalid input so callers can skip the row.

export function formatCardTimestamp(iso: string | undefined | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const date = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} · ${time}`
}
