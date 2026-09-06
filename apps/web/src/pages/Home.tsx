import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { logsApi, type LogItem } from '../lib/api'
import { MealSection } from '../components/MealSection'
import { DailySummary } from '../components/DailySummary'
import { ThemeToggle } from '../components/ThemeToggle'
import { CalendarPopover } from '../components/CalendarPopover'
import { useAuth } from '../store/auth'
import { formatDateCN, shiftDate, todayStr } from '../lib/format'

export function Home() {
  const { user, logout } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const today = todayStr()
  const [date, setDate] = useState(() => sessionStorage.getItem('hp-date') ?? today)
  const [calOpen, setCalOpen] = useState(false)

  // 记住正在看的日期，从 /add 返回后仍是同一天
  useEffect(() => {
    sessionStorage.setItem('hp-date', date)
  }, [date])

  const logsQ = useQuery({
    queryKey: ['logs', date],
    queryFn: () => logsApi.list(date),
  })
  const sumQ = useQuery({
    queryKey: ['summary', date],
    queryFn: () => logsApi.summary(date),
  })

  const logs: LogItem[] = logsQ.data ?? []
  const isToday = date === today

  function refresh() {
    qc.invalidateQueries({ queryKey: ['logs', date] })
    qc.invalidateQueries({ queryKey: ['summary', date] })
  }

  function goAdd() {
    navigate('/add', { state: { date } })
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-content items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-base font-bold text-white shadow-lift">
              轻
            </span>
            <div className="min-w-0 leading-tight">
              <h1 className="text-[15px] font-semibold tracking-wide">轻卡</h1>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                {user?.username} 的记录
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle />
            {/* 添加入口：窄屏圆形加号，宽屏带文字的胶囊按钮（固定在顶栏，不遮挡内容） */}
            <button
              type="button"
              aria-label="添加食物"
              onClick={goAdd}
              className="tap hidden items-center gap-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 py-1.5 pl-3.5 pr-4 text-sm font-semibold text-white shadow-soft transition-all hover:brightness-105 active:scale-95 dark:from-emerald-500 dark:to-teal-500 dark:text-emerald-950 lg:flex"
            >
              ＋ 添加食物
            </button>
            <button
              type="button"
              aria-label="添加食物"
              onClick={goAdd}
              className="tap flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-light leading-none text-white shadow-soft transition-all hover:scale-105 active:scale-90 lg:hidden"
            >
              ＋
            </button>
            <button
              type="button"
              onClick={logout}
              className="tap rounded-full px-2.5 py-1 text-sm text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-content px-4 py-5 sm:px-6">
        {/* 日期选择：‹ › 逐天，点中间日期弹日历任选 */}
        <div className="mb-5 flex items-center justify-center">
          <div className="relative">
            <div className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-white p-1 shadow-soft dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                aria-label="前一天"
                onClick={() => {
                  setCalOpen(false)
                  setDate((d) => shiftDate(d, -1))
                }}
                className="tap flex h-9 w-9 items-center justify-center rounded-full text-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800"
              >
                ‹
              </button>
              <div
                role="button"
                tabIndex={0}
                aria-label="选择日期"
                title="点击选择日期"
                onClick={() => setCalOpen((v) => !v)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setCalOpen((v) => !v)
                  }
                }}
                className={`flex cursor-pointer select-none items-center gap-2 rounded-full px-3 py-1 text-sm transition-colors sm:px-5 ${
                  calOpen ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isToday ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                />
                <span className="tabular font-medium">{formatDateCN(date, today)}</span>
                {!isToday && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCalOpen(false)
                      setDate(today)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        setCalOpen(false)
                        setDate(today)
                      }
                    }}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20 dark:bg-primary-dark/10 dark:text-primary-dark"
                  >
                    回今天
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-label="后一天"
                onClick={() => {
                  setCalOpen(false)
                  setDate((d) => shiftDate(d, 1))
                }}
                className="tap flex h-9 w-9 items-center justify-center rounded-full text-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800"
              >
                ›
              </button>
            </div>

            {/* 日历浮层 */}
            {calOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setCalOpen(false)}
                />
                <div className="absolute left-1/2 top-full z-40 mt-2 -translate-x-1/2 animate-[rise-in_0.15s_ease-out]">
                  <CalendarPopover
                    value={date}
                    today={today}
                    onPick={(iso) => {
                      setDate(iso)
                      setCalOpen(false)
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-12">
          {/* 汇总（移动端在上） */}
          <div className="order-1 lg:order-2 lg:col-span-5">
            <DailySummary summary={sumQ.data} />
          </div>

          {/* 当日记录 */}
          <div className="order-2 lg:order-1 lg:col-span-7">
            <MealSection items={logs} onChanged={refresh} />
          </div>
        </div>
      </main>
    </div>
  )
}
