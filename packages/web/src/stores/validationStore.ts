import { create } from 'zustand'
import type { ValidationIssue } from '../validation/types'

export type FocusTarget = {
  nodeId?: string
  edgeId?: string
}

type ValidationState = {
  enabled: boolean
  issues: ValidationIssue[]
  ignoredIds: string[]
  focusTarget: FocusTarget | null
  panelOpen: boolean
  setEnabled: (enabled: boolean) => void
  setIssues: (issues: ValidationIssue[]) => void
  ignoreIssue: (id: string) => void
  clearIgnored: () => void
  requestFocus: (target: FocusTarget) => void
  clearFocus: () => void
  setPanelOpen: (open: boolean) => void
  /** 立即触发一次重算（供 Toolbar「立即校验」） */
  runToken: number
  bumpRun: () => void
}

export const useValidationStore = create<ValidationState>((set) => ({
  enabled: true,
  issues: [],
  ignoredIds: [],
  focusTarget: null,
  panelOpen: false,
  runToken: 0,
  setEnabled: (enabled) =>
    set({
      enabled,
      ...(enabled ? {} : { issues: [] as ValidationIssue[] }),
    }),
  setIssues: (issues) => set({ issues }),
  ignoreIssue: (id) =>
    set((s) =>
      s.ignoredIds.includes(id) ? s : { ignoredIds: [...s.ignoredIds, id] },
    ),
  clearIgnored: () => set({ ignoredIds: [] }),
  requestFocus: (target) => set({ focusTarget: target }),
  clearFocus: () => set({ focusTarget: null }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  bumpRun: () => set((s) => ({ runToken: s.runToken + 1 })),
}))

/** 未被忽略的可见问题 */
export function selectVisibleIssues(s: ValidationState): ValidationIssue[] {
  return s.issues.filter((i) => !s.ignoredIds.includes(i.id))
}
