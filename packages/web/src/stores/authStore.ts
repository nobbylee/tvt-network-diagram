import { create } from 'zustand'
import type { AuthUser } from '../api/auth'

// 用 sessionStorage 而不是 localStorage：本工具靠主平台 SSO handoff 登录，同一浏览器多个
//标签页各自带自己账号的 token 打开时，localStorage 是跨标签页共享的，后打开的账号会把
// 先打开的标签页登录态覆盖掉，造成"切换到别的账号项目"的假象。sessionStorage 按标签页隔离，
// 每次从主平台点入口进来都会重新 handoff 一次，不依赖跨标签页/跨会话持久化，可以放心切。
const TOKEN_KEY = 'tvt_narch_token'
const USER_KEY = 'tvt_narch_user'

type AuthState = {
  token: string | null
  user: AuthUser | null
  hydrated: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
  loadFromStorage: () => void
  setUser: (user: AuthUser) => void
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  login: (token, user) => {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    set({ token: null, user: null })
  },

  loadFromStorage: () => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    const user = readStoredUser()
    set({
      token: token || null,
      user: token ? user : null,
      hydrated: true,
    })
  },

  setUser: (user) => {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user })
  },
}))
