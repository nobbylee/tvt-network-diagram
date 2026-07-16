import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { AnchorNode } from '../types/diagram'

/** 箭头端点：小圆点，可拖拽调整箭头位置 */
function AnchorNodeComponent({ selected }: NodeProps<AnchorNode>) {
  return (
    <div
      className="relative flex h-3 w-3 items-center justify-center"
      style={{
        transform: 'translate(-50%, -50%)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        isConnectableStart
        isConnectableEnd
        className="!pointer-events-none !h-2 !w-2 !border-0 !bg-transparent !opacity-0"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        isConnectableStart
        isConnectableEnd
        className="!pointer-events-none !h-2 !w-2 !border-0 !bg-transparent !opacity-0"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      />
      <div
        className="h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm"
        style={{
          background: selected ? 'var(--accent)' : 'var(--text-secondary)',
          boxShadow: selected ? '0 0 0 3px rgba(47, 93, 80, 0.25)' : undefined,
        }}
      />
    </div>
  )
}

export const AnchorNodeView = memo(AnchorNodeComponent)
