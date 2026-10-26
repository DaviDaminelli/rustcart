import { createContext, use, useState, type ReactNode } from 'react'
import { api } from '@/lib/api'
import type { User } from '@/types'

interface Session {
  token: string
  user: User
}

interface AuthContextValue {
  session: Session | null
  login(email: string, password: string): Promise<void>
  logout(): void
}

const STORAGE_KEY = 'rustcart.session'
const AuthContext = createContext<AuthContextValue | null>(null)

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)

  async function login(email: string, password: string) {
    const res = await api.login(email, password)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(res))
    setSession(res)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }

  return <AuthContext value={{ session, login, logout }}>{children}</AuthContext>
}

export function useAuth() {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
