import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

function errMsg(e: unknown): string {
  const d = (e as { response?: { data?: { message?: unknown } } })?.response
    ?.data?.message
  if (Array.isArray(d)) return d.join('；')
  if (typeof d === 'string') return d
  return '注册失败，请稍后再试'
}

const inputCls =
  'tap mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

export function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await register(email, username, password)
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
          <p className="text-sm text-slate-400">创建账号，开始记录</p>
        </div>

        <form
          onSubmit={submit}
          className="overflow-hidden rounded-2xl bg-white p-6 shadow-soft dark:bg-slate-900"
        >
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
          <h2 className="mt-4 mb-4 text-base font-semibold">注册新账号</h2>

          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            邮箱
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={inputCls}
            />
          </label>
          <label className="mt-3 block text-sm font-medium text-slate-600 dark:text-slate-300">
            用户名
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className={inputCls}
            />
          </label>
          <label className="mt-3 block text-sm font-medium text-slate-600 dark:text-slate-300">
            密码（至少 6 位）
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className={inputCls}
            />
          </label>

          {err && <p className="mt-3 text-sm text-red-500">{err}</p>}

          <button
            type="submit"
            disabled={busy}
            className="tap mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-[15px] font-semibold text-white shadow-lift transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-60 dark:from-emerald-500 dark:to-teal-500 dark:text-emerald-950"
          >
            {busy ? '注册中…' : '注册'}
          </button>

          <p className="mt-4 text-center text-sm text-slate-400">
            已有账号？{' '}
            <Link to="/login" className="font-medium text-emerald-600 dark:text-emerald-400">
              去登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
