import { useEffect, useState } from 'react'
import { ProjectList } from './pages/ProjectList'
import { Editor } from './pages/Editor'
import { Login } from './pages/Login'
import { useAuthStore } from './stores/authStore'

type View =
  | { page: 'list' }
  | { page: 'editor'; projectId: string; projectName: string; customer?: string }

export default function App() {
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage)
  const [view, setView] = useState<View>({ page: 'list' })

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  // 退出登录后回到列表态，下次登录从列表开始
  useEffect(() => {
    if (!token) {
      setView({ page: 'list' })
    }
  }, [token])

  if (!hydrated) {
    return (
      <div
        className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]"
        style={{ background: 'var(--app-bg)' }}
      >
        加载中…
      </div>
    )
  }

  if (!token) {
    return <Login />
  }

  if (view.page === 'editor') {
    return (
      <Editor
        projectId={view.projectId}
        projectName={view.projectName}
        customer={view.customer}
        onBack={() => setView({ page: 'list' })}
      />
    )
  }

  return (
    <ProjectList
      onOpenProject={(id, name, customer) => {
        setView({
          page: 'editor',
          projectId: id,
          projectName: name,
          customer,
        })
      }}
    />
  )
}
