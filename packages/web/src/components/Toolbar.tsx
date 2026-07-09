import { useRef, useState } from 'react'
import { exportNarch, updateProject } from '../api/projects'
import { ApiError } from '../api/client'
import { useAuthStore } from '../stores/authStore'
import { useCanvasStore } from '../stores/canvasStore'
import { useUiStore } from '../stores/uiStore'
import {
  diagramToNarch,
  downloadNarchFile,
  narchToDiagram,
  readNarchFile,
} from '../utils/narch'

type ToolbarProps = {
  projectId: string
  projectName: string
  customer?: string
  onBack: () => void
}

function IconButton({
  children,
  title,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode
  title: string
  onClick?: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
      }`}
    >
      {children}
    </button>
  )
}

function userInitial(displayName?: string, username?: string): string {
  const name = displayName || username || '?'
  return name.slice(0, 1).toUpperCase()
}

export function Toolbar({
  projectId,
  projectName,
  customer = '',
  onBack,
}: ToolbarProps) {
  const undo = useCanvasStore((s) => s.undo)
  const redo = useCanvasStore((s) => s.redo)
  const past = useCanvasStore((s) => s.past)
  const future = useCanvasStore((s) => s.future)
  const zoomPercent = useCanvasStore((s) => s.zoomPercent)
  const resetDiagram = useCanvasStore((s) => s.resetDiagram)
  const copySelected = useCanvasStore((s) => s.copySelected)
  const pasteClipboard = useCanvasStore((s) => s.pasteClipboard)
  const libraryCollapsed = useUiStore((s) => s.libraryCollapsed)
  const propertiesCollapsed = useUiStore((s) => s.propertiesCollapsed)
  const toggleLibrary = useUiStore((s) => s.toggleLibrary)
  const toggleProperties = useUiStore((s) => s.toggleProperties)
  const canvasTool = useUiStore((s) => s.canvasTool)
  const setCanvasTool = useUiStore((s) => s.setCanvasTool)
  const user = useAuthStore((s) => s.user)

  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const statusTimer = useRef<number | null>(null)

  function showStatus(msg: string, ms = 2500) {
    setStatus(msg)
    if (statusTimer.current) window.clearTimeout(statusTimer.current)
    statusTimer.current = window.setTimeout(() => setStatus(null), ms)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { nodes, edges } = useCanvasStore.getState()
      await updateProject(projectId, {
        name: projectName,
        customer: customer || undefined,
        diagram: { nodes, edges },
      })
      showStatus('已保存')
    } catch (err) {
      showStatus(err instanceof ApiError ? err.message : '保存失败', 4000)
    } finally {
      setSaving(false)
    }
  }

  async function handleExport() {
    try {
      await exportNarch(projectId, `${projectName || 'project'}.narch`)
      showStatus('已导出')
    } catch {
      // 后端不可用时，用当前画布本地导出
      const { nodes, edges } = useCanvasStore.getState()
      const narch = diagramToNarch(nodes, edges, {
        projectName,
        customer,
        author: user?.displayName || user?.username,
      })
      downloadNarchFile(narch, `${projectName || 'project'}.narch`)
      showStatus('已本地导出')
    }
  }

  async function handleImportFile(file: File) {
    try {
      const narch = await readNarchFile(file)
      const { nodes, edges } = narchToDiagram(narch)
      resetDiagram(nodes, edges)
      showStatus('已导入到画布（请保存以同步服务器）', 3500)
    } catch (err) {
      showStatus(err instanceof Error ? err.message : '导入失败', 4000)
    } finally {
      if (importRef.current) importRef.current.value = ''
    }
  }

  return (
    <header
      className="flex h-12 shrink-0 items-center gap-3 border-b px-3"
      style={{
        background: 'var(--toolbar-bg)',
        borderColor: 'var(--panel-border)',
      }}
    >
      <button
        type="button"
        onClick={onBack}
        title="返回项目列表"
        className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>

      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-tvt-500 text-xs font-bold text-white">
          T
        </div>
        <span className="text-sm font-semibold text-[var(--text-primary)]">TVT 网络架构图</span>
        <span className="text-[var(--text-muted)]">/</span>
        <span className="max-w-[200px] truncate text-sm text-[var(--text-secondary)]">
          {projectName}
        </span>
      </div>

      <div className="h-5 w-px bg-[var(--panel-border)]" />

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-60"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          {saving ? '保存中…' : '保存'}
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".narch,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleImportFile(file)
          }}
        />
        <button
          type="button"
          onClick={() => importRef.current?.click()}
          className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.2" />
            <path d="M3 12h10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          导入
        </button>
        <button
          type="button"
          onClick={() => void handleExport()}
          className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 10V2M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.2" />
            <path d="M3 12h10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          导出
        </button>
      </div>

      {status && (
        <span className="text-xs text-[var(--accent)]" role="status">
          {status}
        </span>
      )}

      <div className="h-5 w-px bg-[var(--panel-border)]" />

      <div className="flex items-center gap-0.5">
        <IconButton title="撤销 (Ctrl+Z)" onClick={undo} disabled={past.length === 0}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h8a3 3 0 1 0 0-6H9" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 5L3 8l3 3" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </IconButton>
        <IconButton title="重做 (Ctrl+Y)" onClick={redo} disabled={future.length === 0}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H5a3 3 0 1 1 0-6h2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </IconButton>
        <IconButton title="复制 (Ctrl+C)" onClick={() => copySelected()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M3 11V3h8" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </IconButton>
        <IconButton title="粘贴 (Ctrl+V)" onClick={() => pasteClipboard()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5 3h6v2H5V3z" stroke="currentColor" strokeWidth="1.2" />
            <rect x="3.5" y="5" width="9" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </IconButton>
      </div>

      <div className="h-5 w-px bg-[var(--panel-border)]" />

      <div className="flex items-center gap-0.5">
        <IconButton
          title="缩小"
          onClick={() => window.dispatchEvent(new Event('tvt-zoom-out'))}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10 10l3 3M5 7h4" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </IconButton>
        <button
          type="button"
          title="重置缩放"
          onClick={() => window.dispatchEvent(new Event('tvt-zoom-reset'))}
          className="min-w-[3rem] text-center text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {zoomPercent}%
        </button>
        <IconButton
          title="放大"
          onClick={() => window.dispatchEvent(new Event('tvt-zoom-in'))}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10 10l3 3M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </IconButton>
      </div>

      <div className="h-5 w-px bg-[var(--panel-border)]" />

      <div className="flex items-center gap-0.5">
        <IconButton
          title="选择工具 (V)"
          active={canvasTool === 'select'}
          onClick={() => setCanvasTool('select')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 2l4 11 2-4 4-2L3 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </IconButton>
        <IconButton
          title="文本框 (T)"
          active={canvasTool === 'text'}
          onClick={() => setCanvasTool('text')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3h10M8 3v10M5 13h6" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </IconButton>
        <IconButton
          title="箭头标注 (A)"
          active={canvasTool === 'arrow'}
          onClick={() => setCanvasTool('arrow')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 13L13 3M13 3H8M13 3v5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </IconButton>
      </div>

      <div className="h-5 w-px bg-[var(--panel-border)]" />

      <div className="flex items-center gap-0.5">
        <IconButton
          title={libraryCollapsed ? '展开元件库' : '折叠元件库'}
          onClick={toggleLibrary}
          active={!libraryCollapsed}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 4h6M8 8h6M8 12h4" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </IconButton>
        <IconButton
          title={propertiesCollapsed ? '展开属性面板' : '折叠属性面板'}
          onClick={toggleProperties}
          active={!propertiesCollapsed}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="10" y="3" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 4h6M2 8h6M2 12h4" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </IconButton>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-tvt-100 text-xs font-medium text-tvt-600">
          {userInitial(user?.displayName, user?.username)}
        </div>
      </div>
    </header>
  )
}
