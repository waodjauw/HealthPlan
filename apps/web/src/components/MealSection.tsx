import { logsApi, type LogItem } from '../lib/api'
import { fmtKcal, fmtMacro } from '../lib/format'
import { catIcon } from '../lib/foodMeta'

export function MealSection({
  items,
  onChanged,
}: {
  items: LogItem[]
  onChanged: () => void
}) {
  const total = items.reduce((a, b) => a + b.nutrition.kcal, 0)

  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft dark:bg-slate-900 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold">
          吃了什么
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:bg-primary-dark/15 dark:text-primary-dark">
            {items.length} 条
          </span>
        </h3>
        <span className="tabular text-sm font-semibold text-slate-700 dark:text-slate-200">
          {fmtKcal(total)}
          <span className="ml-0.5 text-xs font-normal text-slate-400">kcal</span>
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-3xl">🥗</span>
          <p className="text-sm text-slate-400">今天还没有记录</p>
          <p className="text-xs text-slate-300 dark:text-slate-600">
            点右上角「＋ 添加食物」开始记录
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li
              key={it.id}
              className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
                {catIcon(it.category)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{it.foodName}</div>
                <div className="tabular mt-0.5 text-xs text-slate-400">
                  {fmtMacro(it.grams)}g · 碳{fmtMacro(it.nutrition.carbs)} 蛋
                  {fmtMacro(it.nutrition.protein)} 脂{fmtMacro(it.nutrition.fat)}
                </div>
              </div>
              <div className="tabular text-sm font-semibold text-slate-700 dark:text-slate-200">
                {fmtKcal(it.nutrition.kcal)}
                <span className="ml-0.5 text-[10px] font-normal text-slate-400">kcal</span>
              </div>
              <button
                type="button"
                aria-label={`删除 ${it.foodName}`}
                title="删除"
                onClick={async () => {
                  await logsApi.remove(it.id)
                  onChanged()
                }}
                className="shrink-0 rounded-full px-2 py-1 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-950/40"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
