import { useState } from 'react'
import {
  brandColors,
  brandLabels,
  iconOptions,
  type DeviceBrand,
  type DeviceIconType,
  type DeviceItem,
} from '../data/deviceLibrary'
import { DeviceIcon } from './DeviceIcon'

export type DeviceFormValues = {
  name: string
  icon: DeviceIconType
  brand: DeviceBrand
}

type DeviceFormModalProps = {
  title: string
  initial?: DeviceFormValues
  onSubmit: (values: DeviceFormValues) => void
  onClose: () => void
}

function inputStyle(): React.CSSProperties {
  return {
    background: 'var(--input-bg)',
    borderColor: 'var(--input-border)',
    color: 'var(--text-primary)',
  }
}

export function DeviceFormModal({ title, initial, onSubmit, onClose }: DeviceFormModalProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState<DeviceIconType>(initial?.icon ?? 'ipc-bullet')
  const [brand, setBrand] = useState<DeviceBrand>(initial?.brand ?? 'tvt')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit({ name: trimmed, icon, brand })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[var(--radius-md)] border p-5 shadow-lg"
        style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] text-[var(--text-muted)]">设备名称</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如 筒形 IPC"
              className="h-9 w-full rounded-[var(--radius-sm)] border px-3 text-sm outline-none focus:border-[var(--accent)]"
              style={inputStyle()}
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] text-[var(--text-muted)]">分类</label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value as DeviceBrand)}
              className="h-9 w-full rounded-[var(--radius-sm)] border px-3 text-sm outline-none focus:border-[var(--accent)]"
              style={inputStyle()}
            >
              {(Object.keys(brandLabels) as DeviceBrand[]).map((key) => (
                <option key={key} value={key}>
                  {brandLabels[key]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] text-[var(--text-muted)]">图标形态</label>
            <div className="grid grid-cols-4 gap-1.5">
              {iconOptions.map((opt) => {
                const selected = icon === opt.value
                const color = brandColors[brand]
                return (
                  <button
                    key={opt.value}
                    type="button"
                    title={opt.label}
                    onClick={() => setIcon(opt.value)}
                    className="flex flex-col items-center gap-1 rounded-[var(--radius-sm)] border p-2 transition-colors"
                    style={{
                      borderColor: selected ? 'var(--accent)' : 'var(--panel-border)',
                      background: selected ? 'var(--accent-soft)' : 'var(--panel-bg)',
                    }}
                  >
                    <DeviceIcon type={opt.value} brand={brand} size={20} />
                    <span
                      className="truncate text-[9px]"
                      style={{ color: selected ? color : 'var(--text-muted)' }}
                    >
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 flex-1 rounded-[var(--radius-sm)] border text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
              style={{ borderColor: 'var(--panel-border)' }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="h-9 flex-1 rounded-[var(--radius-sm)] bg-[var(--accent)] text-sm font-medium text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

type ConfirmDeleteProps = {
  item: DeviceItem
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDeleteModal({ item, onConfirm, onClose }: ConfirmDeleteProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-[var(--radius-md)] border p-5"
        style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">删除元件</h3>
        <p className="mb-4 text-xs text-[var(--text-secondary)]">
          确定删除「{item.name}」？此操作不会影响画布上已放置的设备。
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 flex-1 rounded-[var(--radius-sm)] border text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
            style={{ borderColor: 'var(--panel-border)' }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 flex-1 rounded-[var(--radius-sm)] bg-red-500 text-sm font-medium text-white hover:bg-red-600"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  )
}
