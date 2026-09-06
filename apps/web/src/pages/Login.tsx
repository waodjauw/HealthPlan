import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

function errMsg(e: unknown): string {
  const d = (e as { response?: { data?: { message?: unknown } } })?.response
    ?.data?.message
  if (Array.isArray(d)) return d.join('；')
  if (typeof d === 'string') return d
  return '登录失败，请稍后再试'
}

const inputCls =
  'tap mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

export function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await login(account, password)
      nav('/')
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* 品牌 */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-2xl font-bold text-white shadow-lift">
            轻
          </span>
          <h1 className="mt-1 text-xl font-bold tracking-wide">轻卡</h1>
          <p className="text-sm text-slate-400">记录每一餐，看清碳蛋脂</p>
        </div>

        <form
          onSubmit={submit}
          className="overflow-hidden rounded-2xl bg-white p-6 shadow-soft dark:bg-slate-900"
        >
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
          <h2 className="mt-4 mb-1 text-base font-semibold">登录</h2>
          <p className="mb-4 text-xs text-slate-400">欢迎回来，继续你的饮食记录</p>

          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            邮箱或用户名
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              autoComplete="username"
              className={inputCls}
            />
          </label>
          <label className="mt-3 block text-sm font-medium text-slate-600 dark:text-slate-300">
            密码
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={inputCls}
            />
          </label>

          {err && <p className="mt-3 text-sm text-red-500">{err}</p>}

          <button
            type="submit"
            disabled={busy}
            className="tap mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-[15px] font-semibold text-white shadow-lift transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-60 dark:from-emerald-500 dark:to-teal-500 dark:text-emerald-950"
          >
            {busy ? '登录中…' : '登录'}
          </button>

          <p className="mt-4 text-center text-sm text-slate-400">
            还没有账号？{' '}
            <Link to="/register" className="font-medium text-emerald-600 dark:text-emerald-400">
              去注册
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
