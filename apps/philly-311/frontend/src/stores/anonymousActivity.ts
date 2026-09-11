// ABOUTME: Pinia store tracking this anonymous browser's own upvotes and submitted
// ABOUTME: reports (localStorage) — mirrors 311-mobile-app's anonymousUpvotedIDs/
// ABOUTME: anonymousSubmittedIDs, since the API has no account to key off of for
// ABOUTME: anonymous requests: it can't dedupe a repeat upvote, and a report you
// ABOUTME: submitted anonymously still 400s if you try to upvote it.
import { defineStore } from 'pinia'

const UPVOTED_KEY = 'philly311:anonymousUpvotedIds'
const SUBMITTED_KEY = 'philly311:anonymousSubmittedIds'

function readIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

function writeIds(key: string, ids: string[]): void {
  localStorage.setItem(key, JSON.stringify(ids))
}

export const useAnonymousActivityStore = defineStore('anonymousActivity', {
  state: () => ({
    upvotedIds: readIds(UPVOTED_KEY),
    submittedIds: readIds(SUBMITTED_KEY),
  }),
  getters: {
    isUpvoted: (state) => (id: string) => state.upvotedIds.includes(id),
    isSubmitted: (state) => (id: string) => state.submittedIds.includes(id),
  },
  actions: {
    markUpvoted(id: string) {
      if (this.upvotedIds.includes(id)) return
      this.upvotedIds = [...this.upvotedIds, id]
      writeIds(UPVOTED_KEY, this.upvotedIds)
    },
    markSubmitted(id: string) {
      if (this.submittedIds.includes(id)) return
      this.submittedIds = [...this.submittedIds, id]
      writeIds(SUBMITTED_KEY, this.submittedIds)
    },
  },
})
