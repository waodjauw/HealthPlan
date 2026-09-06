import { useState } from 'react'
import { monthGrid, type DayCell } from '../lib/format'

const WEEK = ['一', '二', '三', '四', '五', '六', '日']

export function CalendarPopover({
  value,
  today,
  onPick,
}: {
  value: string
  today: string
  onPick: (iso: string) => void
}) {
  const init = new Date(value + 'T00:00:00')
  const [ym, setYm] = useState({ y: init.getFullYear(), m: init.getMonth() })
  const cells = monthGrid(ym.y, ym.m)

  function shiftMonth(delta: number) {
    const d = new Date(ym.y, ym.m + delta, 1)
    setYm({ y: d.getFullYear(), m: d.getMonth() })
  }
  function toToday() {
    const t = new Date(today + 'T00:00:00')
    setYm({ y: t.getFullYear(), m: t.getMonth() })
    onPick(today)
  }

  const todayInView =
    today.startsWith(`${ym.y}-${String(ym.m + 1).padStart(2, '0')}`)

  function cellCls(c: DayCell): string {
    const base =
      'flex h-9 w-9 items-center justify-center rounded-full text-[13px] tabular transition-colors '
    if (c.iso === value)
      return `${base} bg-gradient-to-br from-emerald-500 to-teal-600 font-semibold text-white shadow-soft`
    if (c.iso === today)
      return `${base} font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-400/70 hover:bg-emerald-50 dark:text-emerald-300 dark:ring-emerald-500/50 dark:hover:bg-emerald-950/40`
    if (!c.inMonth)
      return `${base} text-slate-300 hover:bg-slate-100 dark:text-slate-700 dark:hover:bg-slate-800`
    return `${base} text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800`
  }
  // 周内换行留白：42 格按 7 列排，索引对齐无特殊处理

  return (
    <div className="w-[264px] rounded-2xl border border-slate-200/80 bg-white p-3 shadow-lift dark:border-slate-700 dark:bg-slate-900">
      {/* 年月切换 */}
      <div className="mb-1 flex items-center justify-between">
        <button
          type="button"
          aria-label="上个月"
          onClick={() => shiftMonth(-1)}
          className="tap flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          ‹
        </button>
        <span className="text-sm font-semibold">
          {ym.y}年{ym.m + 1}月
        </span>
        <button
          type="button"
          aria-label="下个月"
          onClick={() => shiftMonth(1)}
          className="tap flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          ›
        </button>
      </div>

      {/* 星期表头 */}
      <div className="grid grid-cols-7 py-1 text-center">
        {WEEK.map((w) => (
          <span
            key={w}
            className={`h-6 text-[11px] leading-6 ${w === '日' ? 'text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            {w}
          </span>
        ))}
      </div>

      {/* 日期格 */}
      <div className="grid grid-cols-7 justify-items-center">
        {cells.map((c) => (
          <button
            type="button"
            key={c.iso}
            onClick={() => onPick(c.iso)}
            className={cellCls(c)}
          >
            {Number(c.iso.slice(8, 10))}
          </button>
        ))}
      </div>

      {/* 今天 */}
      <div className="mt-1 flex justify-end border-t border-slate-100 pt-2 dark:border-slate-800">
        <button
          type="button"
          onClick={toToday}
          className={`tap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            todayInView
              ? 'text-slate-300 dark:text-slate-600'
              : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40'
          }`}
          disabled={todayInView}
        >
          回到今天
        </button>
      </div>
    </div>
  )
}
