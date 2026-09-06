import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi, TOKEN_KEY, type AuthUser } from '../lib/api'

interface AuthContextValue {
  user: AuthUser | null
  ready: boolean
  login: (account: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      const token = await AsyncStorage.getItem(TOKEN_KEY)
      if (!token) {
        setReady(true)
        return
      }
      try {
        setUser(await authApi.me())
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY)
      } finally {
        setReady(true)
      }
    })()
  }, [])

  const login = useCallback(async (account: string, password: string) => {
    const res = await authApi.login(account, password)
    await AsyncStorage.setItem(TOKEN_KEY, res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(async (email: string, username: string, password: string) => {
    const res = await authApi.register(email, username, password)
    await AsyncStorage.setItem(TOKEN_KEY, res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, ready, login, register, logout }),
    [user, ready, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return ctx
}
