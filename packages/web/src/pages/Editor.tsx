import { useEffect, useState } from 'react'
import { getProject } from '../api/projects'
import { ApiError } from '../api/client'
import { Toolbar } from '../components/Toolbar'
import { DeviceLibrary } from '../components/DeviceLibrary'
import { CanvasArea } from '../components/CanvasArea'
import { PropertyPanel } from '../components/PropertyPanel'
import { ValidationController } from '../components/ValidationController'
import { ValidationPanel } from '../components/ValidationPanel'
import { useCanvasStore } from '../stores/canvasStore'

type EditorProps = {
  projectId: string
  projectName: string
  customer?: string
  onBack: () => void
}

export function Editor({ projectId, projectName, customer = '', onBack }: EditorProps) {
  const resetDiagram = useCanvasStore((s) => s.resetDiagram)
  const dirty = useCanvasStore((s) => s.dirty)
  const [name, setName] = useState(projectName)
  const [customerName, setCustomerName] = useState(customer)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const project = await getProject(projectId)
        if (cancelled) return
        setName(project.name)
        setCustomerName(project.customer ?? '')
        const nodes = project.diagram?.nodes ?? []
        const edges = project.diagram?.edges ?? []
        resetDiagram(nodes, edges)
      } catch (err) {
        if (cancelled) return
        // 加载失败时清空画布，避免残留上一个项目的数据
        resetDiagram([], [])
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('加载项目失败')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [projectId, resetDiagram])

  // 未保存离开页面提示
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!useCanvasStore.getState().dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  function handleBack() {
    if (dirty && !window.confirm('有未保存的修改，确定返回？')) return
    onBack()
  }

  if (loading) {
    return (
      <div
        className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]"
        style={{ background: 'var(--app-bg)' }}
      >
        正在加载项目…
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-3"
        style={{ background: 'var(--app-bg)' }}
      >
        <p className="text-sm" style={{ color: '#b91c1c' }}>
          {error}
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="h-9 rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 text-sm text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)]"
        >
          返回项目列表
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full min-w-[1280px] flex-col" style={{ background: 'var(--app-bg)' }}>
      <ValidationController />
      <Toolbar
        projectId={projectId}
        projectName={name}
        customer={customerName}
        onBack={handleBack}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <DeviceLibrary />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CanvasArea />
          <ValidationPanel />
        </div>
        <PropertyPanel />
      </div>
    </div>
  )
}
