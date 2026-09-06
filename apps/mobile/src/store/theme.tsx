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
import { useColorScheme } from 'react-native'
import {
  darkPalette,
  lightPalette,
  type Palette,
  type ThemeMode,
} from '../theme'

const MODE_KEY = 'hp_theme_mode'

interface ThemeContextValue {
  mode: ThemeMode
  isDark: boolean
  colors: Palette
  setMode: (m: ThemeMode) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme()
  const [mode, setModeState] = useState<ThemeMode>('system')

  useEffect(() => {
    ;(async () => {
      const saved = await AsyncStorage.getItem(MODE_KEY)
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved)
      }
    })()
  }, [])

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark'

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m)
    void AsyncStorage.setItem(MODE_KEY, m)
  }, [])

  const toggle = useCallback(() => {
    setMode(isDark ? 'light' : 'dark')
  }, [isDark, setMode])

  const value = useMemo(
    () => ({ mode, isDark, colors: isDark ? darkPalette : lightPalette, setMode, toggle }),
    [mode, isDark, setMode, toggle],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme 必须在 ThemeProvider 内使用')
  return ctx
}
