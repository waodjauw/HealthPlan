import type { DailySummary as DailySummaryType } from '@healthplan/core'
import { fmtKcal, fmtMacro } from '../lib/format'

export function DailySummary({ summary }: { summary?: DailySummaryType }) {
  const total = summary?.total
  const share = summary?.share
  const hasData = !!total && total.kcal > 0

  const macros = [
    { key: 'carb', label: '碳水', g: total ? fmtMacro(total.carbs) : '0', dot: 'bg-carb', text: 'text-carb' },
    { key: 'protein', label: '蛋白', g: total ? fmtMacro(total.protein) : '0', dot: 'bg-protein', text: 'text-protein' },
    { key: 'fat', label: '脂肪', g: total ? fmtMacro(total.fat) : '0', dot: 'bg-fat', text: 'text-fat' },
  ] as const

  const segments = hasData && share
    ? [
        { key: 'carb', pct: share.carbs, bg: 'bg-carb' },
        { key: 'protein', pct: share.protein, bg: 'bg-protein' },
        { key: 'fat', pct: share.fat, bg: 'bg-fat' },
      ]
    : []

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-soft dark:bg-slate-900">
      {/* 顶栏强调条 */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold">
            <span className="h-4 w-1 rounded-full bg-gradient-to-b from-emerald-400 to-teal-600" />
            当日汇总
          </h3>
          {hasData && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
              已完成记录
            </span>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="tabular bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-5xl font-bold leading-none tracking-tight text-transparent dark:from-emerald-300 dark:to-teal-300">
            {total ? fmtKcal(total.kcal) : 0}
          </span>
          <span className="text-sm font-medium text-slate-400">kcal</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {macros.map((m) => (
            <div
              key={m.key}
              className="rounded-xl bg-slate-50 px-2 py-2.5 text-center dark:bg-slate-800/60"
            >
              <div className={`mx-auto mb-1.5 flex items-center justify-center gap-1 text-xs ${m.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
                {m.label}
              </div>
              <div className="tabular text-[15px] font-semibold text-slate-700 dark:text-slate-200">
                {m.g}
                <span className="ml-0.5 text-[10px] font-normal text-slate-400">g</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-slate-400">
            <span>供能占比</span>
            {hasData && (
              <span className="tabular">
                碳{share?.carbs}% · 蛋{share?.protein}% · 脂{share?.fat}%
              </span>
            )}
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            {segments.length > 0 ? (
              segments.map((s) => (
                <div key={s.key} className={s.bg} style={{ width: `${s.pct}%` }} />
              ))
            ) : (
              <div className="w-full bg-slate-100 dark:bg-slate-800" />
            )}
          </div>
          {!hasData && (
            <p className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-sm">🍽️</span> 今天还没有记录，吃点东西再来看看吧
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
