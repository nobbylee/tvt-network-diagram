import { useState, type FormEvent } from 'react'
import { login as loginApi } from '../api/auth'
import { ApiError } from '../api/client'
import { useAuthStore } from '../stores/authStore'

type LoginProps = {
  onSuccess?: () => void
}

export function Login({ onSuccess }: LoginProps) {
  const login = useAuthStore((s) => s.login)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password) {
      setError('请输入用户名和密码')
      return
    }

    setLoading(true)
    try {
      const res = await loginApi(username.trim(), password)
      login(res.token, res.user)
      onSuccess?.()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('登录失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex h-full items-center justify-center px-4"
      style={{ background: 'var(--app-bg)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-8 shadow-sm"
        style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)' }}
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-tvt-500 text-lg font-bold text-white">
            T
          </div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">TVT 网络架构图</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">登录后管理与编辑拓扑项目</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">用户名</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-10 rounded-lg border px-3 text-sm outline-none focus:border-[var(--accent)]"
              style={{
                background: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)',
              }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">密码</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="h-10 rounded-lg border px-3 text-sm outline-none focus:border-[var(--accent)]"
              style={{
                background: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)',
              }}
            />
          </label>

          {error && (
            <div
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: '#fef2f2', color: '#b91c1c' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex h-10 items-center justify-center rounded-lg bg-tvt-500 text-sm font-medium text-white transition-colors hover:bg-tvt-600 disabled:opacity-60"
          >
            {loading ? '登录中…' : '登录'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-[var(--text-muted)]">
          默认账号：admin / admin123
        </p>
      </div>
    </div>
  )
}
