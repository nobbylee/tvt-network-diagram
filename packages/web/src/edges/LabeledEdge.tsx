import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import { useValidationStore } from '../stores/validationStore'
import type { ConnectionEdge } from '../types/diagram'

function buildLabel(data: ConnectionEdge['data']): string | undefined {
  if (!data) return undefined
  const port =
    data.sourcePort && data.targetPort
      ? `${data.sourcePort} → ${data.targetPort}`
      : data.sourcePort || data.targetPort
  const type = data.connectionType

  if (port && type) return `${type} · ${port}`
  return type || port || undefined
}

function LabeledEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<ConnectionEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const label = buildLabel(data)
  const issueLevel = useValidationStore((s) => {
    let level: 'error' | 'warning' | null = null
    for (const i of s.issues) {
      if (s.ignoredIds.includes(i.id)) continue
      if (!i.edgeIds?.includes(id)) continue
      if (i.severity === 'error') return 'error'
      if (level == null) level = 'warning'
    }
    return level
  })
  const hasError = issueLevel === 'error'
  const hasWarning = issueLevel === 'warning'

  let stroke = selected ? 'var(--accent)' : 'rgba(47, 93, 80, 0.55)'
  if (hasError) stroke = 'var(--danger)'
  else if (hasWarning) stroke = 'var(--warning)'

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: selected || hasError || hasWarning ? 2.5 : 2,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none absolute max-w-[160px] truncate rounded border px-1.5 py-0.5 text-[9px] text-[var(--text-secondary)]"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: 'var(--panel-bg)',
              borderColor:
                hasError || hasWarning
                  ? stroke
                  : selected
                    ? 'var(--accent)'
                    : 'var(--panel-border)',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const LabeledEdge = memo(LabeledEdgeComponent)
