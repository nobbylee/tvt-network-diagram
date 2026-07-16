import { useEffect, useState } from 'react'
import { handoff } from '../api/auth'
import { ApiError } from '../api/client'
import { useAuthStore } from '../stores/authStore'

/**
 * 免密登录网关：只接受从「TVT技术服务部平台」跳转过来时带的 ?token=&name= 参数，
 * 不提供账号密码输入框。文件名/组件名沿用 Login 是为了减少改动面（App.tsx 的引用不用改）。
 */
export function Login() {
  const login = useAuthStore((s) => s.login)
  const [status, setStatus] = useState<'exchanging' | 'error' | 'no-token'>('exchanging')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const name = params.get('name')

    if (!token) {
      setStatus('no-token')
      return
    }

    handoff(token, name ?? undefined)
      .then((res) => {
        login(res.token, res.user)
        // 登录凭证不宜长期留在地址栏/浏览器历史里
        window.history.replaceState(null, '', window.location.pathname)
      })
      .catch((err) => {
        setStatus('error')
        setError(err instanceof ApiError ? err.message : '登录失败，请回到主平台重新进入')
      })
  }, [login])

  return (
    <div
      className="flex h-full items-center justify-center px-4"
      style={{ background: 'var(--app-bg)' }}
    >
      <div
        className="w-full max-w-sm rounded-[var(--radius-md)] border p-8 text-center shadow-sm"
        style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)' }}
      >
        <h1 className="nb-title text-lg">网络拓扑图绘制工具</h1>

        {status === 'exchanging' && (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">正在登录…</p>
        )}

        {status === 'no-token' && (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            请从「TVT技术服务部平台」进入本工具，不支持直接访问
          </p>
        )}

        {status === 'error' && (
          <div
            className="mt-4 rounded-[var(--radius-sm)] px-3 py-2 text-sm"
            style={{ background: '#fef2f2', color: '#b91c1c' }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
