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

export async function login(username: string, password: string): Promise<LoginResponse> {
  const data = await apiRequest<{
    token: string
    user: { id: string | number; username: string; displayName?: string | null }
  }>('/api/auth/login', {
    method: 'POST',
    body: { username, password },
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
