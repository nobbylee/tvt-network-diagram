import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react'
import type { AnnotationEdge } from '../types/diagram'

function AnnotationEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}: EdgeProps<AnnotationEdge>) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  const color = data?.color ?? '#e11d48'
  const strokeWidth = data?.strokeWidth ?? 2
  const label = data?.label
  const markerId = `arrow-${id}`

  return (
    <>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={selected ? 'var(--accent)' : color} />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        style={{
          stroke: selected ? 'var(--accent)' : color,
          strokeWidth: selected ? strokeWidth + 0.5 : strokeWidth,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none absolute max-w-[140px] truncate rounded border px-1.5 py-0.5 text-[9px]"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: 'var(--panel-bg)',
              borderColor: selected ? 'var(--accent)' : 'var(--panel-border)',
              color: 'var(--text-secondary)',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const AnnotationEdgeView = memo(AnnotationEdgeComponent)
