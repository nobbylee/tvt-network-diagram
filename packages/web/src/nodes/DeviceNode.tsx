import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { DeviceIcon } from '../components/DeviceIcon'
import { brandColors } from '../data/deviceLibrary'
import { useValidationStore } from '../stores/validationStore'
import type { DeviceNode } from '../types/diagram'

function resolveBrandColor(brand: string) {
  return brand in brandColors
    ? brandColors[brand as keyof typeof brandColors]
    : brandColors.generic
}

function DeviceNodeComponent({ id, data, selected }: NodeProps<DeviceNode>) {
  const brandColor = resolveBrandColor(String(data.brand))
  const hasExtra = Boolean(data.model || data.ip)
  const iconBox = 'h-8 w-8 rounded-[var(--radius-sm)]'
  const iconSize = 20

  // 返回原始字符串，避免 selector 每次新建数组触发无限更新
  const issueLevel = useValidationStore((s) => {
    let level: 'error' | 'warning' | null = null
    for (const i of s.issues) {
      if (s.ignoredIds.includes(i.id)) continue
      if (!i.nodeIds?.includes(id)) continue
      if (i.severity === 'error') return 'error'
      if (level == null) level = 'warning'
    }
    return level
  })
  const hasError = issueLevel === 'error'
  const hasWarning = issueLevel === 'warning'

  let borderColor = selected ? 'var(--node-selected)' : 'var(--node-border)'
  if (hasError) borderColor = 'var(--danger)'
  else if (hasWarning) borderColor = 'var(--warning)'

  return (
    <div
      className="relative w-40 rounded-[var(--radius-sm)] border bg-[var(--node-bg)] text-left shadow-sm"
      style={{
        borderColor,
        borderWidth: selected || hasError || hasWarning ? 2 : 1,
        boxShadow: selected ? '0 0 0 3px rgba(47, 93, 80, 0.12)' : 'none',
      }}
    >
      {hasError && (
        <span
          className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full"
          style={{ background: 'var(--danger)' }}
          title="存在配置错误"
        />
      )}
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

      <div className="h-0.5 rounded-t-[var(--radius-sm)]" style={{ background: brandColor }} />
      <div className={hasExtra ? 'p-2.5' : 'p-2'}>
        <div className="flex items-center gap-2">
          <div
            className={`flex shrink-0 items-center justify-center ${iconBox}`}
            style={{ background: `${brandColor}14` }}
          >
            <DeviceIcon type={String(data.icon)} size={iconSize} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="nb-title truncate text-xs">
              {data.name}
            </div>
            {data.model && (
              <div className="truncate font-mono text-[10px] text-[var(--text-muted)]">{data.model}</div>
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
