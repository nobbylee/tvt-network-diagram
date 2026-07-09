import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { DeviceIcon, hasPhotoIcon } from '../components/DeviceIcon'
import { brandColors } from '../data/deviceLibrary'
import type { DeviceNode } from '../types/diagram'

function resolveBrandColor(brand: string) {
  return brand in brandColors
    ? brandColors[brand as keyof typeof brandColors]
    : brandColors.generic
}

function DeviceNodeComponent({ data, selected }: NodeProps<DeviceNode>) {
  const brandColor = resolveBrandColor(String(data.brand))
  const hasExtra = Boolean(data.model || data.ip)
  const isPhoto = hasPhotoIcon(String(data.icon), String(data.brand))
  const isNvr = isPhoto && (data.icon === 'nvr' || data.icon === 'dvr')
  const iconBox = isNvr ? 'h-12 w-12' : isPhoto ? 'h-10 w-10' : 'h-8 w-8 rounded-md'
  const iconSize = isNvr ? 48 : isPhoto ? 36 : 20

  return (
    <div
      className="w-40 rounded-lg border bg-[var(--node-bg)] text-left shadow-sm"
      style={{
        borderColor: selected ? 'var(--node-selected)' : 'var(--node-border)',
        borderWidth: selected ? 2 : 1,
        boxShadow: selected ? '0 0 0 3px rgba(0, 102, 204, 0.12)' : 'none',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-[var(--accent)]"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-[var(--accent)]"
      />

      <div className="h-0.5 rounded-t-lg" style={{ background: brandColor }} />
      <div className={hasExtra ? 'p-2.5' : 'p-2'}>
        <div className="flex items-center gap-2">
          <div
            className={`flex shrink-0 items-center justify-center ${iconBox}`}
            style={isPhoto ? undefined : { background: `${brandColor}14` }}
          >
            <DeviceIcon
              type={String(data.icon)}
              brand={String(data.brand)}
              size={iconSize}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-[var(--text-primary)]">
              {data.name}
            </div>
            {data.model && (
              <div className="truncate text-[10px] text-[var(--text-muted)]">{data.model}</div>
            )}
          </div>
        </div>
        {data.ip && (
          <div
            className="mt-2 rounded px-2 py-0.5 font-mono text-[10px]"
            style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)' }}
          >
            {data.ip}
          </div>
        )}
      </div>
    </div>
  )
}

export const DeviceNodeView = memo(DeviceNodeComponent)
