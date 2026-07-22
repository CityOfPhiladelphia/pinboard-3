// ABOUTME: Pinia store for the signed-in user's cases. Holds report drafts
// ABOUTME: (localStorage) now; submitted cases will come from the user-cases
// ABOUTME: endpoint once login and the Reports tab exist.
import { defineStore } from 'pinia'
import type { ReportDraft } from '@/types/wizard'

const STORAGE_KEY = 'philly311:drafts'

function readDrafts(): ReportDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ReportDraft[]) : []
  } catch {
    return []
  }
}

function writeDrafts(drafts: ReportDraft[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
}

export const useMyCasesStore = defineStore('myCases', {
  state: () => ({ drafts: readDrafts() }),
  actions: {
    saveDraft(draft: Omit<ReportDraft, 'id' | 'savedAt'>): ReportDraft {
      const saved: ReportDraft = {
        ...draft,
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
      }
      this.drafts = [saved, ...this.drafts]
      writeDrafts(this.drafts)
      return saved
    },
    deleteDraft(id: string) {
      this.drafts = this.drafts.filter((d) => d.id !== id)
      writeDrafts(this.drafts)
    },
  },
})
