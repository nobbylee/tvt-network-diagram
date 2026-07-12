import { brandLabels, type DeviceBrand } from '../data/deviceLibrary'
import { useCanvasStore } from '../stores/canvasStore'
import { useUiStore } from '../stores/uiStore'
import type { DeviceNode, TextNode } from '../types/diagram'

function Field({
  label,
  optional,
  children,
}: {
  label: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="mb-2.5">
      <label className="mb-1 flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
        {label}
        {optional && <span>（选填）</span>}
      </label>
      {children}
    </div>
  )
}

function inputStyle(): React.CSSProperties {
  return {
    background: 'var(--input-bg)',
    borderColor: 'var(--input-border)',
    color: 'var(--text-primary)',
  }
}

const brandOptions: { value: DeviceBrand; label: string }[] = [
  { value: 'tvt', label: brandLabels.tvt },
  { value: 'generic', label: brandLabels.generic },
]

const connectionTypes = ['网线', '光纤', 'PoE', 'WiFi', '4G']
const annotColors = [
  { value: '#e11d48', label: '红' },
  { value: '#0066cc', label: '蓝' },
  { value: '#0f172a', label: '黑' },
  { value: '#16a34a', label: '绿' },
  { value: '#ca8a04', label: '黄' },
]

export function PropertyPanel() {
  const collapsed = useUiStore((s) => s.propertiesCollapsed)
  const toggleProperties = useUiStore((s) => s.toggleProperties)

  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const selectedEdgeId = useCanvasStore((s) => s.selectedEdgeId)
  const updateNodeData = useCanvasStore((s) => s.updateNodeData)
  const updateEdgeData = useCanvasStore((s) => s.updateEdgeData)
  const takeSnapshot = useCanvasStore((s) => s.takeSnapshot)

  const node = nodes.find((n) => n.id === selectedNodeId) ?? null
  const edge = edges.find((e) => e.id === selectedEdgeId) ?? null
  const sourceNode = edge ? nodes.find((n) => n.id === edge.source) : null
  const targetNode = edge ? nodes.find((n) => n.id === edge.target) : null

  const snapshotOnFocus = () => takeSnapshot()

  const title = (() => {
    if (!node && !edge) return '未选中'
    if (node?.type === 'text') return '文本框'
    if (node?.type === 'anchor') return '箭头端点'
    if (node?.type === 'device') return (node as DeviceNode).data.name
    if (edge?.type === 'annotation') return '标注箭头'
    return '连线'
  })()

  if (collapsed) {
    return (
      <aside
        className="flex w-10 shrink-0 flex-col items-center border-l py-3"
        style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)' }}
      >
        <button
          type="button"
          title="展开属性面板"
          onClick={toggleProperties}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--accent)]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
        <div
          className="mt-4 text-[10px] tracking-widest text-[var(--text-muted)]"
          style={{ writingMode: 'vertical-rl' }}
        >
          属性
        </div>
      </aside>
    )
  }

  return (
    <aside
      className="flex w-64 shrink-0 flex-col border-l"
      style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)' }}
    >
      <div className="border-b px-4 py-3" style={{ borderColor: 'var(--panel-border)' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-xs text-[var(--text-muted)]">属性</h2>
            <p className="mt-0.5 truncate text-sm text-[var(--text-primary)]">{title}</p>
          </div>
          <button
            type="button"
            title="折叠属性面板"
            onClick={toggleProperties}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M5 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
        </div>
      </div>

      {!node && !edge ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: 'var(--hover-bg)', color: 'var(--text-muted)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M6 9h6M9 6v6" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            点击节点或连线进行编辑；工具栏可添加文本 / 箭头标注
          </p>
        </div>
      ) : node?.type === 'text' ? (
        <div className="panel-scroll flex-1 overflow-y-auto px-4 py-3">
          {(() => {
            const t = node as TextNode
            return (
              <>
                <Field label="文字内容">
                  <textarea
                    value={t.data.text}
                    rows={4}
                    onFocus={snapshotOnFocus}
                    onChange={(e) => updateNodeData(t.id, { text: e.target.value })}
                    className="w-full resize-none rounded-[var(--radius-sm)] border px-2.5 py-2 text-xs outline-none focus:border-[var(--accent)]"
                    style={inputStyle()}
                  />
                </Field>
                <Field label="字号">
                  <input
                    type="number"
                    min={10}
                    max={32}
                    value={t.data.fontSize ?? 13}
                    onFocus={snapshotOnFocus}
                    onChange={(e) =>
                      updateNodeData(t.id, {
                        fontSize: Math.min(32, Math.max(10, Number(e.target.value) || 13)),
                      })
                    }
                    className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 text-xs outline-none focus:border-[var(--accent)]"
                    style={inputStyle()}
                  />
                </Field>
                <Field label="颜色">
                  <div className="flex flex-wrap gap-1.5">
                    {annotColors.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        title={c.label}
                        onClick={() => {
                          takeSnapshot()
                          updateNodeData(t.id, { color: c.value })
                        }}
                        className="h-6 w-6 rounded-full border-2"
                        style={{
                          background: c.value,
                          borderColor:
                            (t.data.color ?? '#0f172a') === c.value
                              ? 'var(--accent)'
                              : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                </Field>
                <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                  双击文本框可直接编辑；Ctrl+Enter 确认
                </p>
              </>
            )
          })()}
        </div>
      ) : node?.type === 'anchor' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            拖拽端点可调整箭头位置；删除端点会移除整条标注箭头
          </p>
        </div>
      ) : node?.type === 'device' ? (
        <div className="panel-scroll flex-1 overflow-y-auto px-4 py-3">
          {(() => {
            const d = node as DeviceNode
            const icon = String(d.data.icon)
            const isRecorder = icon === 'nvr' || icon === 'dvr'
            const isSwitch = icon === 'switch'
            const isPowered =
              icon.startsWith('ipc-') || icon === 'ptz' || icon === 'access'
            return (
              <>
                <p className="nb-kicker mb-2">基本信息</p>
                <Field label="设备名称">
                  <input
                    type="text"
                    value={d.data.name}
                    onFocus={snapshotOnFocus}
                    onChange={(e) => updateNodeData(d.id, { name: e.target.value })}
                    className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 text-xs outline-none focus:border-[var(--accent)]"
                    style={inputStyle()}
                  />
                </Field>
                <Field label="品牌">
                  <select
                    value={String(d.data.brand)}
                    onFocus={snapshotOnFocus}
                    onChange={(e) => updateNodeData(d.id, { brand: e.target.value })}
                    className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 text-xs outline-none focus:border-[var(--accent)]"
                    style={inputStyle()}
                  >
                    {brandOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="型号" optional>
                  <input
                    type="text"
                    value={d.data.model ?? ''}
                    placeholder="如 TD-3316H2-16P"
                    onFocus={snapshotOnFocus}
                    onChange={(e) =>
                      updateNodeData(d.id, { model: e.target.value || undefined })
                    }
                    className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 text-xs outline-none focus:border-[var(--accent)]"
                    style={inputStyle()}
                  />
                </Field>
                <Field label="安装位置" optional>
                  <input
                    type="text"
                    value={d.data.location ?? ''}
                    placeholder="如 一楼大厅"
                    onFocus={snapshotOnFocus}
                    onChange={(e) =>
                      updateNodeData(d.id, { location: e.target.value || undefined })
                    }
                    className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 text-xs outline-none focus:border-[var(--accent)]"
                    style={inputStyle()}
                  />
                </Field>
                <Field label="备注" optional>
                  <textarea
                    value={d.data.notes ?? ''}
                    placeholder="选填"
                    rows={2}
                    onFocus={snapshotOnFocus}
                    onChange={(e) =>
                      updateNodeData(d.id, { notes: e.target.value || undefined })
                    }
                    className="w-full resize-none rounded-[var(--radius-sm)] border px-2.5 py-2 text-xs outline-none focus:border-[var(--accent)]"
                    style={inputStyle()}
                  />
                </Field>

                <p className="nb-kicker mb-2 mt-3">网络</p>
                <Field label="IP 地址" optional>
                  <input
                    type="text"
                    value={d.data.ip ?? ''}
                    placeholder="如 192.168.1.10"
                    onFocus={snapshotOnFocus}
                    onChange={(e) =>
                      updateNodeData(d.id, { ip: e.target.value || undefined })
                    }
                    className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 font-mono text-xs outline-none focus:border-[var(--accent)]"
                    style={inputStyle()}
                  />
                </Field>
                <Field label="子网掩码" optional>
                  <input
                    type="text"
                    value={d.data.subnetMask ?? ''}
                    placeholder="255.255.255.0 或 /24"
                    onFocus={snapshotOnFocus}
                    onChange={(e) =>
                      updateNodeData(d.id, { subnetMask: e.target.value || undefined })
                    }
                    className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 font-mono text-xs outline-none focus:border-[var(--accent)]"
                    style={inputStyle()}
                  />
                </Field>
                <Field label="网关" optional>
                  <input
                    type="text"
                    value={d.data.gateway ?? ''}
                    placeholder="如 192.168.1.1"
                    onFocus={snapshotOnFocus}
                    onChange={(e) =>
                      updateNodeData(d.id, { gateway: e.target.value || undefined })
                    }
                    className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 font-mono text-xs outline-none focus:border-[var(--accent)]"
                    style={inputStyle()}
                  />
                </Field>
                <Field label="MAC" optional>
                  <input
                    type="text"
                    value={d.data.mac ?? ''}
                    placeholder="选填"
                    onFocus={snapshotOnFocus}
                    onChange={(e) =>
                      updateNodeData(d.id, { mac: e.target.value || undefined })
                    }
                    className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 font-mono text-xs outline-none focus:border-[var(--accent)]"
                    style={inputStyle()}
                  />
                </Field>

                {(isRecorder || isSwitch || isPowered) && (
                  <p className="nb-kicker mb-2 mt-3">容量与供电</p>
                )}
                {isRecorder && (
                  <Field label="最大通道数" optional>
                    <input
                      type="number"
                      min={1}
                      value={d.data.maxChannels ?? ''}
                      placeholder="如 8 / 16 / 32"
                      onFocus={snapshotOnFocus}
                      onChange={(e) => {
                        const v = e.target.value
                        updateNodeData(d.id, {
                          maxChannels: v === '' ? undefined : Number(v),
                        })
                      }}
                      className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 text-xs outline-none focus:border-[var(--accent)]"
                      style={inputStyle()}
                    />
                  </Field>
                )}
                {isSwitch && (
                  <>
                    <Field label="PoE 预算 (W)" optional>
                      <input
                        type="number"
                        min={0}
                        value={d.data.poeBudgetW ?? ''}
                        placeholder="如 120"
                        onFocus={snapshotOnFocus}
                        onChange={(e) => {
                          const v = e.target.value
                          updateNodeData(d.id, {
                            poeBudgetW: v === '' ? undefined : Number(v),
                          })
                        }}
                        className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 text-xs outline-none focus:border-[var(--accent)]"
                        style={inputStyle()}
                      />
                    </Field>
                    <Field label="PoE 口数" optional>
                      <input
                        type="number"
                        min={0}
                        value={d.data.poePortCount ?? ''}
                        placeholder="如 8"
                        onFocus={snapshotOnFocus}
                        onChange={(e) => {
                          const v = e.target.value
                          updateNodeData(d.id, {
                            poePortCount: v === '' ? undefined : Number(v),
                          })
                        }}
                        className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 text-xs outline-none focus:border-[var(--accent)]"
                        style={inputStyle()}
                      />
                    </Field>
                  </>
                )}
                {isPowered && (
                  <Field label="功耗 (W)" optional>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={d.data.powerDrawW ?? ''}
                      placeholder="不填则用默认估算"
                      onFocus={snapshotOnFocus}
                      onChange={(e) => {
                        const v = e.target.value
                        updateNodeData(d.id, {
                          powerDrawW: v === '' ? undefined : Number(v),
                        })
                      }}
                      className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 text-xs outline-none focus:border-[var(--accent)]"
                      style={inputStyle()}
                    />
                  </Field>
                )}
              </>
            )
          })()}
        </div>
      ) : edge?.type === 'annotation' ? (
        <div className="panel-scroll flex-1 overflow-y-auto px-4 py-3">
          <Field label="颜色">
            <div className="flex flex-wrap gap-1.5">
              {annotColors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => {
                    takeSnapshot()
                    updateEdgeData(edge.id, { color: c.value })
                  }}
                  className="h-6 w-6 rounded-full border-2"
                  style={{
                    background: c.value,
                    borderColor:
                      (edge.data?.color ?? '#e11d48') === c.value
                        ? 'var(--accent)'
                        : 'transparent',
                  }}
                />
              ))}
            </div>
          </Field>
          <Field label="粗细">
            <input
              type="range"
              min={1}
              max={5}
              value={edge.data?.strokeWidth ?? 2}
              onFocus={snapshotOnFocus}
              onChange={(e) =>
                updateEdgeData(edge.id, { strokeWidth: Number(e.target.value) })
              }
              className="w-full"
            />
          </Field>
          <Field label="标签" optional>
            <input
              type="text"
              value={edge.data?.label ?? ''}
              placeholder="如 注意此处"
              onFocus={snapshotOnFocus}
              onChange={(e) =>
                updateEdgeData(edge.id, { label: e.target.value || undefined })
              }
              className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 text-xs outline-none focus:border-[var(--accent)]"
              style={inputStyle()}
            />
          </Field>
        </div>
      ) : edge ? (
        <div className="panel-scroll flex-1 overflow-y-auto px-4 py-3">
          <div
            className="mb-3 rounded-[var(--radius-sm)] border px-3 py-2 text-[10px] text-[var(--text-secondary)]"
            style={{ borderColor: 'var(--panel-border)', background: 'var(--hover-bg)' }}
          >
            <div className="truncate">
              {sourceNode?.type === 'device'
                ? (sourceNode as DeviceNode).data.name
                : edge.source}
              <span className="mx-1 text-[var(--text-muted)]">→</span>
              {targetNode?.type === 'device'
                ? (targetNode as DeviceNode).data.name
                : edge.target}
            </div>
          </div>
          <Field label="源端口" optional>
            <input
              type="text"
              value={edge.data && 'sourcePort' in edge.data ? (edge.data.sourcePort ?? '') : ''}
              placeholder="如 LAN1"
              onFocus={snapshotOnFocus}
              onChange={(e) =>
                updateEdgeData(edge.id, { sourcePort: e.target.value || undefined })
              }
              className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 text-xs outline-none focus:border-[var(--accent)]"
              style={inputStyle()}
            />
          </Field>
          <Field label="目标端口" optional>
            <input
              type="text"
              value={edge.data && 'targetPort' in edge.data ? (edge.data.targetPort ?? '') : ''}
              placeholder="如 Port 8"
              onFocus={snapshotOnFocus}
              onChange={(e) =>
                updateEdgeData(edge.id, { targetPort: e.target.value || undefined })
              }
              className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 text-xs outline-none focus:border-[var(--accent)]"
              style={inputStyle()}
            />
          </Field>
          <Field label="连接类型" optional>
            <select
              value={
                edge.data && 'connectionType' in edge.data
                  ? (edge.data.connectionType ?? '网线')
                  : '网线'
              }
              onFocus={snapshotOnFocus}
              onChange={(e) => updateEdgeData(edge.id, { connectionType: e.target.value })}
              className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 text-xs outline-none focus:border-[var(--accent)]"
              style={inputStyle()}
            >
              {connectionTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="VLAN" optional>
            <input
              type="text"
              value={edge.data && 'vlan' in edge.data ? (edge.data.vlan ?? '') : ''}
              placeholder="如 10"
              onFocus={snapshotOnFocus}
              onChange={(e) =>
                updateEdgeData(edge.id, { vlan: e.target.value || undefined })
              }
              className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 text-xs outline-none focus:border-[var(--accent)]"
              style={inputStyle()}
            />
          </Field>
          <Field label="带宽 (Mbps)" optional>
            <input
              type="number"
              min={0}
              value={
                edge.data && 'bandwidthMbps' in edge.data
                  ? (edge.data.bandwidthMbps ?? '')
                  : ''
              }
              placeholder="选填"
              onFocus={snapshotOnFocus}
              onChange={(e) => {
                const v = e.target.value
                updateEdgeData(edge.id, {
                  bandwidthMbps: v === '' ? undefined : Number(v),
                })
              }}
              className="h-8 w-full rounded-[var(--radius-sm)] border px-2.5 text-xs outline-none focus:border-[var(--accent)]"
              style={inputStyle()}
            />
          </Field>
          <Field label="备注" optional>
            <textarea
              value={edge.data && 'notes' in edge.data ? (edge.data.notes ?? '') : ''}
              placeholder="选填"
              rows={2}
              onFocus={snapshotOnFocus}
              onChange={(e) =>
                updateEdgeData(edge.id, { notes: e.target.value || undefined })
              }
              className="w-full resize-none rounded-[var(--radius-sm)] border px-2.5 py-2 text-xs outline-none focus:border-[var(--accent)]"
              style={inputStyle()}
            />
          </Field>
        </div>
      ) : null}
    </aside>
  )
}
