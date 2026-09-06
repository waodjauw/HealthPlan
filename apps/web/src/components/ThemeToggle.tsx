import { useTheme } from '../store/theme'

export function ThemeToggle() {
  const { isDark, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      className="tap flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      title="切换主题"
    >
      <span aria-hidden>{isDark ? '🌙' : '☀️'}</span>
      <span>{isDark ? '暗色' : '亮色'}</span>
    </button>
  )
}
