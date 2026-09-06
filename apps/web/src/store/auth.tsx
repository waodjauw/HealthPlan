import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { authApi, type AuthUser } from '../lib/api'

interface AuthState {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (account: string, password: string) => Promise<void>
  register: (
    email: string,
    username: string,
    password: string,
  ) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('hp_token'),
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('hp_token')
    if (!t) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('hp_token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(account: string, password: string) {
    const r = await authApi.login(account, password)
    localStorage.setItem('hp_token', r.token)
    setToken(r.token)
    setUser(r.user)
  }

  async function register(
    email: string,
    username: string,
    password: string,
  ) {
    const r = await authApi.register(email, username, password)
    localStorage.setItem('hp_token', r.token)
    setToken(r.token)
    setUser(r.user)
  }

  function logout() {
    localStorage.removeItem('hp_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return ctx
}
