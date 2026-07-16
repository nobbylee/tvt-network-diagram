import { useEffect, useMemo, useRef, useState } from 'react'
import { exportNarch, updateProject } from '../api/projects'
import { ApiError } from '../api/client'
import { useAuthStore } from '../stores/authStore'
import { useCanvasStore } from '../stores/canvasStore'
import { useUiStore } from '../stores/uiStore'
import { useValidationStore } from '../stores/validationStore'
import {
  diagramToNarch,
  downloadNarchFile,
  narchToDiagram,
  readNarchFile,
} from '../utils/narch'
import {
  captureDiagramPng,
  downloadPngDataUrl,
  safeExportFilename,
} from '../utils/exportImage'
import { exportDiagramPdf } from '../utils/exportPdf'

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
      className={`flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
      }`}
    >
      {children}
    </button>
  )
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
  const markClean = useCanvasStore((s) => s.markClean)

  const validationEnabled = useValidationStore((s) => s.enabled)
  const setValidationEnabled = useValidationStore((s) => s.setEnabled)
  const bumpRun = useValidationStore((s) => s.bumpRun)
  const setPanelOpen = useValidationStore((s) => s.setPanelOpen)
  // 分别订阅原始字段，避免 selector 每次返回新数组导致无限重渲染
  const issues = useValidationStore((s) => s.issues)
  const ignoredIds = useValidationStore((s) => s.ignoredIds)
  const { errorCount, warningCount } = useMemo(() => {
    let errors = 0
    let warnings = 0
    for (const i of issues) {
      if (ignoredIds.includes(i.id)) continue
      if (i.severity === 'error') errors += 1
      else warnings += 1
    }
    return { errorCount: errors, warningCount: warnings }
  }, [issues, ignoredIds])

  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const statusTimer = useRef<number | null>(null)

  function showStatus(msg: string, ms = 2500) {
    setStatus(msg)
    if (statusTimer.current) window.clearTimeout(statusTimer.current)
    statusTimer.current = window.setTimeout(() => setStatus(null), ms)
  }

  // 点击外部关闭导出菜单
  useEffect(() => {
    if (!exportMenuOpen) return
    function onDocClick(e: MouseEvent) {
      if (!exportMenuRef.current?.contains(e.target as Node)) {
        setExportMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [exportMenuOpen])

  async function handleSave() {
    setSaving(true)
    try {
      const { nodes, edges } = useCanvasStore.getState()
      await updateProject(projectId, {
        name: projectName,
        customer: customer || undefined,
        diagram: { nodes, edges },
      })
      markClean()
      showStatus('已保存')
    } catch (err) {
      showStatus(err instanceof ApiError ? err.message : '保存失败', 4000)
    } finally {
      setSaving(false)
    }
  }

  // Ctrl/⌘+S 保存
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅绑定快捷键
  }, [projectId, projectName, customer])

  async function handleExportNarch() {
    setExportMenuOpen(false)
    setExporting(true)
    try {
      await exportNarch(projectId, safeExportFilename(projectName || 'project', '.narch'))
      showStatus('已导出 .narch')
    } catch {
      const { nodes, edges } = useCanvasStore.getState()
      const narch = diagramToNarch(nodes, edges, {
        projectName,
        customer,
        author: user?.displayName || user?.username,
      })
      downloadNarchFile(narch, safeExportFilename(projectName || 'project', '.narch'))
      showStatus('已本地导出 .narch')
    } finally {
      setExporting(false)
    }
  }

  async function handleExportPng() {
    setExportMenuOpen(false)
    setExporting(true)
    showStatus('正在生成 PNG…', 8000)
    try {
      const { nodes } = useCanvasStore.getState()
      const dataUrl = await captureDiagramPng(nodes)
      downloadPngDataUrl(dataUrl, projectName || 'project')
      showStatus('已导出 PNG')
    } catch (err) {
      showStatus(err instanceof Error ? err.message : 'PNG 导出失败', 4000)
    } finally {
      setExporting(false)
    }
  }

  async function handleExportPdf() {
    setExportMenuOpen(false)
    setExporting(true)
    showStatus('正在生成 PDF…', 12000)
    try {
      const { nodes, edges } = useCanvasStore.getState()
      const dataUrl = await captureDiagramPng(nodes)
      await exportDiagramPdf(nodes, edges, {
        projectName,
        customer,
        author: user?.displayName || user?.username,
        diagramDataUrl: dataUrl,
      })
      showStatus('已导出 PDF')
    } catch (err) {
      showStatus(err instanceof Error ? err.message : 'PDF 导出失败', 4000)
    } finally {
      setExporting(false)
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
        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>

      <div className="flex items-center">
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
          className="flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-60"
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
          className="flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.2" />
            <path d="M3 12h10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          导入
        </button>
        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            disabled={exporting}
            onClick={() => setExportMenuOpen((o) => !o)}
            className="flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 10V2M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.2" />
              <path d="M3 12h10" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            {exporting ? '导出中…' : '导出'}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-60">
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
          {exportMenuOpen && (
            <div
              className="absolute left-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-[var(--radius-sm)] border py-1 shadow-sm"
              style={{
                background: 'var(--panel-bg)',
                borderColor: 'var(--panel-border)',
              }}
            >
              <button
                type="button"
                className="flex w-full px-3 py-2 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                onClick={() => void handleExportNarch()}
              >
                导出 .narch
              </button>
              <button
                type="button"
                className="flex w-full px-3 py-2 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                onClick={() => void handleExportPng()}
              >
                导出 PNG 图片
              </button>
              <button
                type="button"
                className="flex w-full px-3 py-2 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                onClick={() => void handleExportPdf()}
              >
                导出 PDF（含图签）
              </button>
            </div>
          )}
        </div>
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

      <div className="flex items-center gap-1">
        <IconButton
          title={validationEnabled ? '关闭实时校验' : '开启实时校验'}
          active={validationEnabled}
          onClick={() => setValidationEnabled(!validationEnabled)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8l3 3 7-7"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </IconButton>
        {validationEnabled && (errorCount > 0 || warningCount > 0) && (
          <button
            type="button"
            title="打开问题面板"
            onClick={() => setPanelOpen(true)}
            className="flex h-8 items-center gap-1 rounded-[var(--radius-sm)] px-2 text-[10px]"
          >
            {errorCount > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-white"
                style={{ background: 'var(--danger)' }}
              >
                {errorCount}
              </span>
            )}
            {warningCount > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-white"
                style={{ background: 'var(--warning)' }}
              >
                {warningCount}
              </span>
            )}
          </button>
        )}
        <button
          type="button"
          title="立即校验"
          onClick={() => {
            setValidationEnabled(true)
            bumpRun()
            setPanelOpen(true)
          }}
          className="flex h-8 items-center rounded-[var(--radius-sm)] px-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
        >
          校验
        </button>
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
    </header>
  )
}
