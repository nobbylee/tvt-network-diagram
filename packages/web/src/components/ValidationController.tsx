import { useEffect, useRef } from 'react'
import { useCanvasStore } from '../stores/canvasStore'
import {
  selectVisibleIssues,
  useValidationStore,
} from '../stores/validationStore'
import { validateDiagram } from '../validation'

const DEBOUNCE_MS = 300

/** 订阅画布变更，防抖执行校验（无 UI） */
export function ValidationController() {
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const enabled = useValidationStore((s) => s.enabled)
  const runToken = useValidationStore((s) => s.runToken)
  const setIssues = useValidationStore((s) => s.setIssues)
  const setPanelOpen = useValidationStore((s) => s.setPanelOpen)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) {
      setIssues([])
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const next = validateDiagram(nodes, edges)
      setIssues(next)
      const visible = selectVisibleIssues({
        ...useValidationStore.getState(),
        issues: next,
      })
      if (visible.some((i) => i.severity === 'error')) {
        setPanelOpen(true)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [nodes, edges, enabled, runToken, setIssues, setPanelOpen])

  return null
}
