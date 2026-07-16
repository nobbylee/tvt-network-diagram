import { useAuthStore } from '../stores/authStore'

/**
 * API 基址：
 * - 开发：默认走同源 /api（由 Vite 代理到后端）
 * - 生产 Docker：同样走同源 /api（由 nginx 反代）
 * - 如需直连，可用 VITE_API_BASE 覆盖
 */
export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE
  if (fromEnv !== undefined && fromEnv !== null) {
    return String(fromEnv).replace(/\/$/, '')
  }
  return ''
}

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
  /** 为 true 时不附带 Authorization */
  skipAuth?: boolean
  /** 自定义 headers（如 multipart 时不要手动设 Content-Type） */
  headers?: Record<string, string>
  /** 原始 FormData / Blob，跳过 JSON 序列化 */
  rawBody?: BodyInit | null
  /** 期望二进制响应 */
  responseType?: 'json' | 'blob' | 'text'
}

function clearAuthAndRedirect() {
  useAuthStore.getState().logout()
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback
  const obj = body as Record<string, unknown>
  if (typeof obj.message === 'string' && obj.message) return obj.message
  if (typeof obj.error === 'string' && obj.error) return obj.error
  return fallback
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    skipAuth = false,
    headers: extraHeaders = {},
    rawBody,
    responseType = 'json',
  } = options

  const headers: Record<string, string> = { ...extraHeaders }

  if (!skipAuth) {
    const token = useAuthStore.getState().token
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  let requestBody: BodyInit | undefined | null = rawBody
  if (rawBody === undefined && body !== undefined) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
    requestBody = JSON.stringify(body)
  }

  const url = path.startsWith('http') ? path : `${getApiBase()}${path}`

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: requestBody ?? undefined,
    })
  } catch {
    throw new ApiError('无法连接服务器，请确认后端已启动', 0)
  }

  if (response.status === 401) {
    clearAuthAndRedirect()
    throw new ApiError('登录已过期，请重新登录', 401)
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (responseType === 'blob') {
    if (!response.ok) {
      let errBody: unknown
      try {
        errBody = await response.json()
      } catch {
        errBody = undefined
      }
      throw new ApiError(
        extractErrorMessage(errBody, `请求失败 (${response.status})`),
        response.status,
        errBody,
      )
    }
    return (await response.blob()) as T
  }

  const text = await response.text()
  let parsed: unknown = undefined
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      if (responseType === 'text') {
        if (!response.ok) {
          throw new ApiError(`请求失败 (${response.status})`, response.status, text)
        }
        return text as T
      }
      parsed = text
    }
  }

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(parsed, `请求失败 (${response.status})`),
      response.status,
      parsed,
    )
  }

  return parsed as T
}

/** 触发浏览器下载 Blob */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
