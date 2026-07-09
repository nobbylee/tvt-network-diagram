import { create } from 'zustand'
import type { AuthUser } from '../api/auth'

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
    const raw = localStorage.getItem(USER_KEY)
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
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ token: null, user: null })
  },

  loadFromStorage: () => {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = readStoredUser()
    set({
      token: token || null,
      user: token ? user : null,
      hydrated: true,
    })
  },

  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user })
  },
}))
