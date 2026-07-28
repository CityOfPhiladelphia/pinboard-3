// ABOUTME: Formats a location count and noun into a display label, e.g. "3 reports";
// ABOUTME: returns "No locations match" when the count is zero.
export function locationCountLabel(count: number, noun: string): string {
  if (count === 0) return 'No locations match'
  return `${count} ${noun}${count > 1 ? 's' : ''}`
}
