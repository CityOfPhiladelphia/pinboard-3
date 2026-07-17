import { ref, type Ref } from 'vue'

const MAX_RECENT = 6

// A per-app list of recent searches, persisted to localStorage. All storage
// access is guarded so a blocked store (private mode) degrades to in-memory.
export function useRecentSearches(appId?: string): {
  recentSearches: Ref<string[]>
  add: (term: string) => void
  remove: (term: string) => void
} {
  const key = `pinboard:recentSearches:${appId ?? 'default'}`

  function read(): string[] {
    try {
      const raw = localStorage.getItem(key)
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
    } catch {
      return []
    }
  }

  const recentSearches = ref<string[]>(read())

  function persist(): void {
    try {
      localStorage.setItem(key, JSON.stringify(recentSearches.value))
    } catch {
      // Storage unavailable — keep the in-memory list.
    }
  }

  function add(term: string): void {
    const trimmed = term.trim()
    if (!trimmed) return
    const withoutDupe = recentSearches.value.filter(
      (t) => t.toLowerCase() !== trimmed.toLowerCase()
    )
    recentSearches.value = [trimmed, ...withoutDupe].slice(0, MAX_RECENT)
    persist()
  }

  function remove(term: string): void {
    recentSearches.value = recentSearches.value.filter(
      (t) => t.toLowerCase() !== term.toLowerCase()
    )
    persist()
  }

  return { recentSearches, add, remove }
}
