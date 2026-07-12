import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import {
  createProject,
  importNarch,
  listProjects,
  removeProject,
  type ProjectSummary,
} from '../api/projects'
import { ApiError } from '../api/client'
import { useAuthStore } from '../stores/authStore'

type ProjectListProps = {
  onOpenProject: (id: string, name: string, customer?: string) => void
}

function formatUpdatedAt(value?: string): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ProjectList({ onOpenProject }: ProjectListProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCustomer, setNewCustomer] = useState('')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await listProjects({ search: debouncedSearch })
      setProjects(items)
    } catch (err) {
      setProjects([])
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('加载项目列表失败')
      }
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  async function handleCreate() {
    const name = newName.trim() || '未命名项目'
    setCreating(true)
    setError(null)
    try {
      const project = await createProject({
        name,
        customer: newCustomer.trim() || undefined,
        diagram: { nodes: [], edges: [] },
      })
      setShowCreate(false)
      setNewName('')
      setNewCustomer('')
      onOpenProject(project.id, project.name, project.customer ?? undefined)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('创建项目失败')
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(e: ReactMouseEvent, project: ProjectSummary) {
    e.stopPropagation()
    if (!window.confirm(`确定删除项目「${project.name}」？此操作不可恢复。`)) {
      return
    }
    try {
      await removeProject(project.id)
      setProjects((prev) => prev.filter((p) => p.id !== project.id))
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('删除失败')
      }
    }
  }

  async function handleImportFile(file: File) {
    setImporting(true)
    setError(null)
    try {
      const project = await importNarch(file)
      await fetchList()
      onOpenProject(project.id, project.name, project.customer ?? undefined)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('导入失败，请检查 .narch 文件')
      }
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--app-bg)' }}>
      <header
        className="flex h-14 shrink-0 items-center justify-between border-b px-6"
        style={{ background: 'var(--toolbar-bg)', borderColor: 'var(--panel-border)' }}
      >
        <div className="text-sm font-semibold text-[var(--text-primary)]">TVT 网络架构图</div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-secondary)]">
            {user?.displayName || user?.username}
          </span>
          <button
            type="button"
            onClick={() => logout()}
            className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            退出
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto px-6 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">我的项目</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              打开已有拓扑，或新建项目开始绘制
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <input
              ref={fileInputRef}
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
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 items-center gap-2 rounded-lg border px-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-60"
              style={{ borderColor: 'var(--panel-border)', background: 'var(--panel-bg)' }}
            >
              {importing ? '导入中…' : '导入 .narch'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex h-9 items-center gap-2 rounded-lg bg-tvt-500 px-4 text-sm font-medium text-white transition-colors hover:bg-tvt-600"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              新建项目
            </button>
          </div>
        </div>

        <div className="relative mb-5 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索项目或客户名..."
            className="h-9 w-full rounded-lg border pl-9 pr-3 text-sm outline-none focus:border-[var(--accent)]"
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {error && (
          <div
            className="mb-4 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm"
            style={{ background: '#fef2f2', color: '#b91c1c' }}
          >
            <span>{error}</span>
            <button
              type="button"
              className="shrink-0 text-xs underline"
              onClick={() => void fetchList()}
            >
              重试
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-sm text-[var(--text-muted)]">加载中…</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              style={{ borderColor: 'var(--panel-border)', background: 'var(--panel-bg)' }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <span className="text-sm text-[var(--text-secondary)]">新建空白项目</span>
            </button>

            {projects.map((project) => (
              <button
                type="button"
                key={project.id}
                onClick={() =>
                  onOpenProject(project.id, project.name, project.customer ?? undefined)
                }
                className="group relative flex min-h-[140px] flex-col rounded-xl border p-4 text-left transition-all hover:border-[var(--accent)] hover:shadow-sm"
                style={{
                  borderColor: 'var(--panel-border)',
                  background: 'var(--panel-bg)',
                }}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: 'var(--accent-soft)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect
                        x="2"
                        y="3"
                        width="14"
                        height="12"
                        rx="2"
                        stroke="var(--accent)"
                        strokeWidth="1.3"
                      />
                      <circle cx="6" cy="8" r="1.2" fill="var(--accent)" />
                      <circle cx="12" cy="11" r="1.2" fill="var(--accent)" />
                      <path d="M7 8.5 L11 10.5" stroke="var(--accent)" strokeWidth="1.2" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {formatUpdatedAt(project.updatedAt)}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      title="删除项目"
                      onClick={(e) => void handleDelete(e, project)}
                      onKeyDown={(e: ReactKeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          if (!window.confirm(`确定删除项目「${project.name}」？此操作不可恢复。`)) {
                            return
                          }
                          void removeProject(project.id)
                            .then(() => {
                              setProjects((prev) => prev.filter((p) => p.id !== project.id))
                            })
                            .catch((err) => {
                              if (err instanceof ApiError) {
                                setError(err.message)
                              } else {
                                setError('删除失败')
                              }
                            })
                        }
                      }}
                      className="rounded p-1 text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M3 4h8M5.5 4V3h3v1M4.5 4l.5 7h4l.5-7"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="mb-1 text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                  {project.name}
                </div>
                <div className="mb-3 text-xs text-[var(--text-secondary)]">
                  {project.customer || '未填写客户'}
                </div>
                <div className="mt-auto flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                  {typeof project.deviceCount === 'number' && (
                    <span>{project.deviceCount} 设备</span>
                  )}
                  {typeof project.deviceCount === 'number' &&
                    typeof project.edgeCount === 'number' && <span>·</span>}
                  {typeof project.edgeCount === 'number' && (
                    <span>{project.edgeCount} 连线</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            暂无项目，点击「新建项目」开始
          </p>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            className="w-full max-w-md rounded-xl border p-6 shadow-lg"
            style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)' }}
          >
            <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">新建项目</h2>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-[var(--text-secondary)]">项目名称</span>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="未命名项目"
                  className="h-9 rounded-lg border px-3 text-sm outline-none focus:border-[var(--accent)]"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-[var(--text-secondary)]">客户名称（可选）</span>
                <input
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  placeholder="客户名"
                  className="h-9 rounded-lg border px-3 text-sm outline-none focus:border-[var(--accent)]"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false)
                  setNewName('')
                  setNewCustomer('')
                }}
                className="h-9 rounded-lg px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
              >
                取消
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={() => void handleCreate()}
                className="h-9 rounded-lg bg-tvt-500 px-4 text-sm font-medium text-white hover:bg-tvt-600 disabled:opacity-60"
              >
                {creating ? '创建中…' : '创建并打开'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
