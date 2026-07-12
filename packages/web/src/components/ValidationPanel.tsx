import { useMemo } from 'react'
import { useValidationStore } from '../stores/validationStore'
import type { ValidationIssue } from '../validation/types'

function SeverityBadge({ severity }: { severity: ValidationIssue['severity'] }) {
  const isError = severity === 'error'
  return (
    <span
      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        background: isError ? 'var(--danger-soft)' : 'var(--warning-soft)',
        color: isError ? 'var(--danger)' : 'var(--warning)',
      }}
    >
      {isError ? '错误' : '警告'}
    </span>
  )
}

export function ValidationPanel() {
  const panelOpen = useValidationStore((s) => s.panelOpen)
  const setPanelOpen = useValidationStore((s) => s.setPanelOpen)
  const enabled = useValidationStore((s) => s.enabled)
  const issues = useValidationStore((s) => s.issues)
  const ignoredIds = useValidationStore((s) => s.ignoredIds)
  const ignoreIssue = useValidationStore((s) => s.ignoreIssue)
  const requestFocus = useValidationStore((s) => s.requestFocus)

  const visible = useMemo(
    () => issues.filter((i) => !ignoredIds.includes(i.id)),
    [issues, ignoredIds],
  )
  const errorCount = visible.filter((i) => i.severity === 'error').length
  const warningCount = visible.filter((i) => i.severity === 'warning').length

  if (!enabled) return null

  return (
    <div
      className="flex shrink-0 flex-col border-t"
      style={{
        background: 'var(--panel-bg)',
        borderColor: 'var(--panel-border)',
        height: panelOpen ? 160 : 36,
      }}
    >
      <button
        type="button"
        className="flex h-9 w-full items-center justify-between px-3 text-left hover:bg-[var(--hover-bg)]"
        onClick={() => setPanelOpen(!panelOpen)}
      >
        <div className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
          <span className="font-medium">配置校验</span>
          {errorCount > 0 && (
            <span className="rounded-full px-1.5 py-0.5 text-[10px] text-white" style={{ background: 'var(--danger)' }}>
              {errorCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="rounded-full px-1.5 py-0.5 text-[10px] text-white" style={{ background: 'var(--warning)' }}>
              {warningCount}
            </span>
          )}
          {errorCount === 0 && warningCount === 0 && (
            <span className="text-[var(--text-muted)]">通过</span>
          )}
        </div>
        <span className="text-[10px] text-[var(--text-muted)]">
          {panelOpen ? '收起' : '展开'}
        </span>
      </button>

      {panelOpen && (
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {visible.length === 0 ? (
            <p className="px-2 py-3 text-xs text-[var(--text-muted)]">
              未发现配置问题
            </p>
          ) : (
            <ul className="space-y-1">
              {visible.map((issue) => (
                <li
                  key={issue.id}
                  className="flex items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-[var(--hover-bg)]"
                >
                  <SeverityBadge severity={issue.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--text-primary)]">{issue.message}</p>
                    {issue.estimated && (
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                        含默认功耗估算
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      className="rounded px-1.5 py-0.5 text-[10px] text-[var(--accent)] hover:bg-[var(--hover-bg)]"
                      onClick={() =>
                        requestFocus({
                          nodeId: issue.nodeIds?.[0],
                          edgeId: issue.edgeIds?.[0],
                        })
                      }
                    >
                      定位
                    </button>
                    <button
                      type="button"
                      className="rounded px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                      onClick={() => ignoreIssue(issue.id)}
                    >
                      忽略
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
