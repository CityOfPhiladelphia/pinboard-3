/**
 * Lowercases, replaces runs of non-alphanumeric characters with a single hyphen,
 * and trims leading/trailing hyphens. ASCII-only by design — intended for
 * deriving a stable, readable id from English place/facility names.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
