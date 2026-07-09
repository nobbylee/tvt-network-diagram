import { ViewportPortal } from '@xyflow/react'
import type { SnapGuide } from '../utils/snap'

type SnapGuideLineProps = {
  guide: SnapGuide
}

/** 水平 / 垂直吸附辅助线（画布坐标系） */
export function SnapGuideLine({ guide }: SnapGuideLineProps) {
  return (
    <ViewportPortal>
      {guide.y != null && (
        <div
          className="pointer-events-none"
          style={{
            position: 'absolute',
            top: guide.y,
            left: -5000,
            width: 10000,
            height: 0,
            borderTop: '1.5px dashed var(--accent)',
            opacity: 0.85,
            zIndex: 5,
          }}
        />
      )}
      {guide.x != null && (
        <div
          className="pointer-events-none"
          style={{
            position: 'absolute',
            left: guide.x,
            top: -5000,
            width: 0,
            height: 10000,
            borderLeft: '1.5px dashed var(--accent)',
            opacity: 0.85,
            zIndex: 5,
          }}
        />
      )}
    </ViewportPortal>
  )
}
