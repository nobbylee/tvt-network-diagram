import { apiRequest } from './client'

export type AuthUser = {
  id: string | number
  username: string
  displayName: string
}

export type LoginResponse = {
  token: string
  user: AuthUser
}

/**
 * 免密登录：用「TVT技术服务部平台」签发的 JWT 换取本工具自己的会话 token。
 * 不再提供账号密码登录入口，只能从主平台跳转进来。
 */
export async function handoff(examToken: string, displayName?: string): Promise<LoginResponse> {
  const data = await apiRequest<{
    token: string
    user: { id: string | number; username: string; displayName?: string | null }
  }>('/api/auth/handoff', {
    method: 'POST',
    body: { examToken, displayName },
    skipAuth: true,
  })
  return {
    token: data.token,
    user: {
      id: data.user.id,
      username: data.user.username,
      displayName: data.user.displayName ?? data.user.username,
    },
  }
}

export async function me(): Promise<AuthUser> {
  const data = await apiRequest<AuthUser | { user: AuthUser }>('/api/auth/me')
  if (data && typeof data === 'object' && 'user' in data) {
    return (data as { user: AuthUser }).user
  }
  return data as AuthUser
}
