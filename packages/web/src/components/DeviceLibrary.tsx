import { useEffect, useState } from 'react'
import {
  brandColors,
  loadDeviceLibrary,
  saveDeviceLibrary,
  type DeviceCategory,
  type DeviceItem,
} from '../data/deviceLibrary'
import { DeviceIcon } from './DeviceIcon'
import {
  ConfirmDeleteModal,
  DeviceFormModal,
  type DeviceFormValues,
} from './DeviceFormModal'
import { useUiStore } from '../stores/uiStore'

function DeviceCard({
  item,
  onEdit,
  onDelete,
}: {
  item: DeviceItem
  onEdit: () => void
  onDelete: () => void
}) {
  const brandColor = brandColors[item.brand]
  const setDraggingDevice = useUiStore((s) => s.setDraggingDevice)

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/tvt-device', JSON.stringify(item))
        e.dataTransfer.effectAllowed = 'move'
        setDraggingDevice(true)
      }}
      onDragEnd={() => setDraggingDevice(false)}
      className="group flex cursor-grab items-center gap-2 rounded-[var(--radius-sm)] border px-2 py-1.5 transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] active:cursor-grabbing"
      style={{
        borderColor: 'var(--panel-border)',
        background: 'var(--panel-bg)',
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
        style={{ background: `${brandColor}14` }}
      >
        <DeviceIcon type={item.icon} size={20} />
      </div>
      <span className="min-w-0 flex-1 truncate text-xs text-[var(--text-primary)] group-hover:text-[var(--accent)]">
        {item.name}
      </span>
      <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          title="编辑"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--accent)]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M8.5 1.5l2 2L4 10H2V8L8.5 1.5z"
              stroke="currentColor"
              strokeWidth="1.1"
            />
          </svg>
        </button>
        <button
          type="button"
          title="删除"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  )
}

type ModalState =
  | { type: 'add'; categoryId?: string }
  | { type: 'edit'; categoryId: string; item: DeviceItem }
  | { type: 'delete'; categoryId: string; item: DeviceItem }
  | null

export function DeviceLibrary() {
  const collapsed = useUiStore((s) => s.libraryCollapsed)
  const toggleLibrary = useUiStore((s) => s.toggleLibrary)

  const [library, setLibrary] = useState<DeviceCategory[]>(() => loadDeviceLibrary())
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>(null)

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev }
      for (const cat of library) {
        if (next[cat.id] === undefined) next[cat.id] = true
      }
      return next
    })
  }, [library])

  useEffect(() => {
    saveDeviceLibrary(library)
  }, [library])

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const filtered = library.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    ),
  }))

  const handleAdd = (values: DeviceFormValues) => {
    const newItem: DeviceItem = {
      id: `custom-${Date.now()}`,
      name: values.name,
      icon: values.icon,
      brand: values.brand,
      custom: true,
    }

    setLibrary((prev) =>
      prev.map((cat) =>
        cat.brand === values.brand
          ? { ...cat, items: [...cat.items, newItem] }
          : cat,
      ),
    )
    setExpanded((prev) => ({ ...prev, [values.brand]: true }))
    setModal(null)
  }

  const handleEdit = (values: DeviceFormValues) => {
    if (modal?.type !== 'edit') return
    const { item } = modal

    setLibrary((prev) => {
      let updated = prev.map((cat) => ({
        ...cat,
        items: cat.items.filter((i) => i.id !== item.id),
      }))

      updated = updated.map((cat) => {
        if (cat.brand !== values.brand) return cat
        return {
          ...cat,
          items: [
            ...cat.items,
            {
              ...item,
              name: values.name,
              icon: values.icon,
              brand: values.brand,
            },
          ],
        }
      })

      return updated
    })
    setExpanded((prev) => ({ ...prev, [values.brand]: true }))
    setModal(null)
  }

  const handleDelete = () => {
    if (modal?.type !== 'delete') return
    const { item } = modal
    setLibrary((prev) =>
      prev.map((cat) => ({
        ...cat,
        items: cat.items.filter((i) => i.id !== item.id),
      })),
    )
    setModal(null)
  }

  if (collapsed) {
    return (
      <aside
        className="flex w-10 shrink-0 flex-col items-center border-r py-3"
        style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)' }}
      >
        <button
          type="button"
          title="展开元件库"
          onClick={toggleLibrary}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--accent)]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
        <div
          className="mt-4 text-[10px] tracking-widest text-[var(--text-muted)]"
          style={{ writingMode: 'vertical-rl' }}
        >
          元件库
        </div>
      </aside>
    )
  }

  return (
    <>
      <aside
        className="flex w-56 shrink-0 flex-col border-r"
        style={{
          background: 'var(--panel-bg)',
          borderColor: 'var(--panel-border)',
        }}
      >
        <div className="border-b px-3 py-3" style={{ borderColor: 'var(--panel-border)' }}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs text-[var(--text-muted)]">元件库</h2>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                title="新增元件"
                onClick={() => setModal({ type: 'add' })}
                className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] text-[var(--accent)] hover:bg-[var(--accent-soft)]"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>
              <button
                type="button"
                title="折叠元件库"
                onClick={toggleLibrary}
                className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </button>
            </div>
          </div>
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <input
              type="text"
              placeholder="搜索设备..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-[var(--radius-sm)] border pl-8 pr-3 text-xs outline-none focus:border-[var(--accent)]"
              style={{
                background: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <p className="mt-2 text-[10px] text-[var(--text-muted)]">拖拽设备到画布即可添加</p>
        </div>

        <div className="panel-scroll flex-1 overflow-y-auto px-2 py-2">
          {filtered.map((category) => (
            <div key={category.id} className="mb-1">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => toggle(category.id)}
                  className="flex min-w-0 flex-1 items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className={`shrink-0 transition-transform ${expanded[category.id] ? 'rotate-90' : ''}`}
                  >
                    <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                  <span className="truncate">{category.name}</span>
                  <span className="ml-auto text-[var(--text-muted)]">{category.items.length}</span>
                </button>
                <button
                  type="button"
                  title={`在「${category.name}」中新增`}
                  onClick={() => setModal({ type: 'add', categoryId: category.id })}
                  className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                </button>
              </div>
              {expanded[category.id] && (
                <div className="mt-0.5 space-y-1 px-1">
                  {category.items.length === 0 ? (
                    <p className="px-2 py-2 text-[10px] text-[var(--text-muted)]">暂无设备，点击 + 添加</p>
                  ) : (
                    category.items.map((item) => (
                      <DeviceCard
                        key={item.id}
                        item={item}
                        onEdit={() =>
                          setModal({ type: 'edit', categoryId: category.id, item })
                        }
                        onDelete={() =>
                          setModal({ type: 'delete', categoryId: category.id, item })
                        }
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {modal?.type === 'add' && (
        <DeviceFormModal
          title="新增元件"
          initial={{
            name: '',
            icon: 'ipc-bullet',
            brand:
              library.find((c) => c.id === modal.categoryId)?.brand ?? 'tvt',
          }}
          onSubmit={handleAdd}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'edit' && (
        <DeviceFormModal
          title="编辑元件"
          initial={{
            name: modal.item.name,
            icon: modal.item.icon,
            brand: modal.item.brand,
          }}
          onSubmit={handleEdit}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'delete' && (
        <ConfirmDeleteModal
          item={modal.item}
          onConfirm={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
