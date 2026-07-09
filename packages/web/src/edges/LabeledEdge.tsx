import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
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

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? 'var(--accent)' : 'rgba(0, 102, 204, 0.55)',
          strokeWidth: selected ? 2.5 : 2,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none absolute max-w-[160px] truncate rounded border px-1.5 py-0.5 text-[9px] text-[var(--text-secondary)]"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: 'var(--panel-bg)',
              borderColor: selected ? 'var(--accent)' : 'var(--panel-border)',
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
