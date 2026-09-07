import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CATEGORIES,
  calcNutrition,
  searchFoods,
  type Food,
  type FoodCategoryCode,
} from '@healthplan/core'
import { foodsApi, logsApi } from '../lib/api'
import { fmtKcal, fmtMacro, todayStr } from '../lib/format'
import { CAT_META, catMeta } from '../lib/foodMeta'

const QUICK_WORDS = [
  '米饭',
  '面条',
  '鸡蛋',
  '鸡胸',
  '牛奶',
  '酸奶',
  '苹果',
  '香蕉',
  '燕麦',
  '番茄',
  '西兰花',
  '牛肉',
]

const TABS = [
  { key: 'all', label: '全部', icon: '🍱' },
  ...CATEGORIES.map((c) => ({
    key: c.code,
    label: c.label,
    icon: catMeta(c.code).icon,
  })),
  { key: 'mine', label: '我的', icon: '⭐' },
] as { key: string; label: string; icon: string }[]

type TabKey = 'all' | 'mine' | FoodCategoryCode
interface CartItem {
  food: Food
  count: number // 个数 / 份数
  perGrams: number // 单个（每份）克数
}
function totalGramsOf(c: CartItem): number {
  return c.count * c.perGrams
}
const EMPTY_FORM = {
  name: '',
  category: 'dish' as FoodCategoryCode,
  kcal: '',
  carbs: '',
  protein: '',
  fat: '',
}

function defaultGrams(food: Food): number {
  const def = food.servings?.find((s) => s.isDefault) ?? food.servings?.[0]
  return def?.grams ?? 100
}
function numOf(v: string): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}
function clampCount(n: number): number {
  if (!Number.isFinite(n)) return 1
  return Math.min(99, Math.max(1, Math.round(n)))
}

export function AddFoodPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const date = (location.state as { date?: string } | null)?.date ?? todayStr()

  const [q, setQ] = useState('')
  const [tab, setTab] = useState<TabKey>('all')
  const [catalog, setCatalog] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    let alive = true
    foodsApi
      .search('')
      .then((all) => {
        if (alive) setCatalog(all)
      })
      .catch(() => {
        if (alive) setCatalog([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  function close() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1)
    else navigate('/', { replace: true })
  }

  const keyword = q.trim()
  const mine = catalog.filter((f) => f.source === 'user')
  const shown: Food[] = keyword
    ? searchFoods(catalog, keyword).slice(0, 40)
    : tab === 'all'
      ? catalog
      : tab === 'mine'
        ? mine
        : catalog.filter((f) => f.category === tab)

  function addToCart(food: Food, count: number, perGrams: number) {
    const c = clampCount(count)
    const g = numOf(String(perGrams))
    if (g <= 0) return
    setCart((prev) => {
      const i = prev.findIndex((x) => x.food.id === food.id)
      const item: CartItem = { food, count: c, perGrams: g }
      if (i >= 0) {
        const next = [...prev]
        next[i] = item
        return next
      }
      return [...prev, item]
    })
  }

  const totalKcal = cart.reduce(
    (s, c) => s + calcNutrition(c.food.per100g, totalGramsOf(c)).kcal,
    0,
  )
  const num = (v: string) => (v === '' ? 0 : Number(v))

  async function createFood() {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const food = await foodsApi.create({
        name: form.name.trim(),
        category: form.category,
        per100g: {
          kcal: num(form.kcal),
          carbs: num(form.carbs),
          protein: num(form.protein),
          fat: num(form.fat),
        },
      })
      setCatalog((prev) => [food, ...prev])
      setCreateOpen(false)
      setForm(EMPTY_FORM)
      addToCart(food, 1, 100)
      setTab('mine')
      setQ('')
    } finally {
      setCreating(false)
    }
  }

  async function submitAll() {
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      await Promise.all(
        cart.map((c) =>
          logsApi.create({ foodId: c.food.id, date, grams: totalGramsOf(c) }),
        ),
      )
      navigate('/', { replace: true })
    } catch (err) {
      const raw = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message
      const msg = Array.isArray(raw) ? raw.join('；') : raw ?? '网络异常，请确认后端已启动'
      alert(`记录失败：${msg}`)
      setSubmitting(false)
    }
  }

  const inCartMap = new Map(cart.map((c) => [c.food.id, c]))
  const grouped = keyword || tab !== 'all'
    ? null
    : CATEGORIES.map((c) => ({
        meta: catMeta(c.code),
        foods: catalog.filter((f) => f.category === c.code),
      })).filter((g) => g.foods.length > 0)

  const rowProps = {
    inCartMap,
    onAdd: addToCart,
    onRemoveCart: (id: string) =>
      setCart((prev) => prev.filter((c) => c.food.id !== id)),
    onRemoveFood: (food: Food) =>
      void foodsApi
        .remove(food.id)
        .then(() => {
          setCatalog((prev) => prev.filter((x) => x.id !== food.id))
          setCart((prev) => prev.filter((c) => c.food.id !== food.id))
        })
        .catch(() => alert('删除失败')),
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-0 sm:px-4">
        {/* 页头 */}
        <div className="sticky top-0 z-30 -mx-0 border-b border-slate-200/70 bg-slate-100/90 px-4 py-3 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/85 sm:mx-0 sm:rounded-none sm:px-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={close}
              className="tap flex items-center gap-1 rounded-full pr-2 text-sm text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <span className="text-lg leading-none">‹</span> 返回
            </button>
            <h3 className="text-[15px] font-semibold">点餐 · 添加食物</h3>
            <span className="w-16 text-right text-xs tabular text-slate-400 dark:text-slate-500">
              {date.slice(5).replace('-', '/')}
            </span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-4 pt-3 sm:px-0">
          {/* 搜索 */}
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] opacity-60">
              🔍
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索想吃的，中文 / 拼音首字母都行"
              className="tap w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-[15px] shadow-soft outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {q && (
              <button
                type="button"
                aria-label="清空"
                onClick={() => setQ('')}
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-500 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
              >
                ✕
              </button>
            )}
          </div>

          {/* 分类 tab */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {TABS.map((t) => {
              const active = !keyword && tab === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setTab(t.key as TabKey)
                    setQ('')
                  }}
                  className={`tap flex shrink-0 items-center gap-1 rounded-full px-3.5 text-[13px] transition-all ${
                    active
                      ? 'bg-primary font-semibold text-white shadow-lift dark:bg-primary-dark dark:text-emerald-950'
                      : 'bg-white text-slate-600 shadow-soft hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-sm leading-none">{t.icon}</span>
                  {t.label}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => {
                setForm({ ...EMPTY_FORM })
                setCreateOpen(true)
                setQ('')
              }}
              className="tap flex shrink-0 items-center rounded-full border border-dashed border-emerald-500/60 px-3.5 text-[13px] font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 dark:border-emerald-400/50 dark:text-emerald-300"
            >
              ＋ 新增自定义
            </button>
          </div>

          {/* 主体 */}
          <div className="mt-1 min-h-0 flex-1 overflow-y-auto pb-4">
            {loading && catalog.length === 0 ? (
              <div className="animate-pulse space-y-2.5 px-1 pt-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="h-14 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60"
                  />
                ))}
                <p className="pt-2 text-center text-xs text-slate-400">加载食物库…</p>
              </div>
            ) : createOpen ? (
              <div className="px-1 pt-3 pop-in">
                <CreateFoodForm
                  form={form}
                  setForm={setForm}
                  creating={creating}
                  onSubmit={createFood}
                  onCancel={() => setCreateOpen(false)}
                />
              </div>
            ) : keyword ? (
              <div className="pt-1">
                <p className="mb-1.5 px-1 text-xs text-slate-400">
                  「{keyword}」的搜索结果 · {shown.length} 条
                </p>
                {shown.map((f) => (
                  <FoodRow key={f.id} food={f} {...rowProps} />
                ))}
                {shown.length === 0 && (
                  <div className="py-12 text-center pop-in">
                    <div className="text-4xl">🔎</div>
                    <p className="mt-3 text-sm text-slate-400">
                      没找到「{keyword}」，换换词，或直接把它建出来
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...EMPTY_FORM, name: keyword })
                        setCreateOpen(true)
                      }}
                      className="tap mx-auto mt-4 flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-lift transition-all hover:opacity-90 dark:bg-primary-dark dark:text-emerald-950"
                    >
                      ＋ 创建自定义食物
                    </button>
                  </div>
                )}
              </div>
            ) : tab === 'all' && grouped ? (
              <div className="pt-1">
                {/* 快捷词 */}
                <div className="mb-3 px-1">
                  <p className="mb-2 text-xs font-medium text-slate-400">⚡ 随便吃点</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_WORDS.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setQ(w)}
                        className="tap rounded-full bg-white px-3.5 py-1 text-[13px] text-slate-600 shadow-soft transition-colors hover:text-emerald-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-emerald-300"
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 按分类分组 */}
                {grouped.map((g) => (
                  <section key={g.meta.code} className="mb-2">
                    <div className="sticky top-0 z-10 -mx-1 mb-0.5 flex items-center gap-2 bg-slate-100/90 px-1 py-1.5 backdrop-blur dark:bg-slate-950/90">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm ${g.meta.tile}`}>
                        {g.meta.icon}
                      </span>
                      <span className="text-[13px] font-semibold">{g.meta.label}</span>
                      <span className="rounded-full bg-slate-200/80 px-1.5 py-px text-[10px] tabular text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {g.foods.length}
                      </span>
                    </div>
                    <div className="overflow-hidden rounded-2xl bg-white shadow-soft dark:bg-slate-900">
                      <div className="divide-y divide-slate-50 px-2 dark:divide-slate-800/60">
                        {g.foods.map((f) => (
                          <FoodRow key={f.id} food={f} {...rowProps} />
                        ))}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            ) : tab === 'mine' && mine.length === 0 ? (
              <div className="py-14 text-center pop-in">
                <div className="text-5xl">🧂</div>
                <p className="mt-3 text-sm text-slate-400">
                  还没有自定义食物。把常吃的但搜不到的记下来，
                  <br />
                  下次就能一键添加啦
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ ...EMPTY_FORM })
                    setCreateOpen(true)
                  }}
                  className="tap mx-auto mt-4 rounded-full border border-dashed border-emerald-500/60 px-5 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-300"
                >
                  ＋ 新增自定义食物
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white shadow-soft dark:bg-slate-900">
                <div className="divide-y divide-slate-50 px-2 dark:divide-slate-800/60">
                  {shown.map((f) => (
                    <FoodRow key={f.id} food={f} {...rowProps} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部已选条 */}
        {cart.length > 0 && !createOpen && (
          <div className="sticky bottom-0 z-30 border-t border-slate-200/80 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_-18px_rgba(15,23,42,0.25)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none]">
              {cart.map((c) => (
                <button
                  key={c.food.id}
                  type="button"
                  onClick={() =>
                    setCart((prev) => prev.filter((x) => x.food.id !== c.food.id))
                  }
                  title={`移除 ${c.food.name}`}
                  className="tap flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-2.5 pr-1.5 text-xs text-slate-600 transition-colors hover:bg-red-50 hover:text-red-500 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-red-950/50"
                >
                  <span className="text-sm leading-none">{catMeta(c.food.category).icon}</span>
                  {c.food.name}
                  <span className="tabular font-semibold">
                    {c.count}×{c.perGrams}g
                  </span>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/70 text-[10px] dark:bg-slate-700">✕</span>
                </button>
              ))}
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400">已选 {cart.length} 项</p>
                <p className="tabular text-[15px] font-bold leading-tight text-slate-800 dark:text-slate-100">
                  约 {fmtKcal(totalKcal)}
                  <span className="ml-1 text-xs font-normal text-slate-400">kcal</span>
                </p>
              </div>
              <button
                type="button"
                onClick={submitAll}
                disabled={submitting}
                className="tap flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 dark:from-emerald-500 dark:to-teal-500 dark:text-emerald-950"
              >
                {submitting ? '添加中…' : '记录'}
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/25 px-1.5 text-xs tabular font-bold">
                  {cart.length}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FoodRow({
  food,
  inCartMap,
  onAdd,
  onRemoveCart,
  onRemoveFood,
}: {
  food: Food
  inCartMap: Map<string, CartItem>
  onAdd: (food: Food, count: number, perGrams: number) => void
  onRemoveCart: (id: string) => void
  onRemoveFood: (food: Food) => void
}) {
  const [open, setOpen] = useState(false)
  const inCart = inCartMap.get(food.id) ?? null
  const [countText, setCountText] = useState(String(inCart?.count ?? 1))
  const [perGText, setPerGText] = useState(
    String(inCart?.perGrams ?? defaultGrams(food)),
  )
  const count = clampCount(numOf(countText) || 1)
  const perG = numOf(perGText)
  const g = count * perG
  const preview = g > 0 ? calcNutrition(food.per100g, g) : null
  const meta = catMeta(food.category)
  const servings = food.servings ?? []

  function toggle() {
    setCountText(String(inCart?.count ?? 1))
    setPerGText(String(inCart?.perGrams ?? defaultGrams(food)))
    setOpen((o) => !o)
  }

  function bumpCount(delta: number) {
    setCountText(String(clampCount(count + delta)))
  }

  function pickServing(grams: number) {
    setCountText('1')
    setPerGText(String(grams))
  }

  return (
    <div className={open ? '' : ''}>
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggle()
          }
        }}
        className="flex w-full cursor-pointer select-none items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${meta.tile}`}>
          {meta.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-medium">{food.name}</span>
            {food.source === 'user' && (
              <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                我的
              </span>
            )}
          </span>
          <span className="tabular text-xs text-slate-400">
            每100g {fmtKcal(food.per100g.kcal)} kcal · 碳{fmtMacro(food.per100g.carbs)} 蛋
            {fmtMacro(food.per100g.protein)} 脂{fmtMacro(food.per100g.fat)}
          </span>
        </span>
        {inCart != null ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold tabular text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
            ✓ {inCart.count}×{inCart.perGrams}g
          </span>
        ) : (
          <span
            role="button"
            tabIndex={0}
            aria-label={`添加 ${food.name}`}
            onClick={(e) => {
              e.stopPropagation()
              onAdd(food, 1, defaultGrams(food))
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                onAdd(food, 1, defaultGrams(food))
              }
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-emerald-600 text-base leading-none text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-400 dark:hover:text-emerald-950"
          >
            ＋
          </span>
        )}
      </div>

      {open && (
        <div className="mx-2 mb-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 pop-in dark:border-slate-800 dark:bg-slate-800/60">
          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-300">
            <span>⚖️</span> 快捷份量
          </div>
          {servings.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {servings.map((s) => {
                const active = count === 1 && perG === s.grams
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => pickServing(s.grams)}
                    className={`tap rounded-full px-3.5 py-1.5 text-xs tabular transition-all ${
                      active
                        ? 'bg-primary font-semibold text-white shadow-soft dark:bg-primary-dark dark:text-emerald-950'
                        : 'bg-white text-slate-600 shadow-soft hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {s.label} {s.grams}g
                  </button>
                )
              })}
            </div>
          )}
          {/* 数量 */}
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-soft dark:bg-slate-900">
            <span className="w-8 text-xs text-slate-400">数量</span>
            <button
              type="button"
              onClick={() => bumpCount(-1)}
              aria-label="减一份"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-lg leading-none text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={99}
              value={countText}
              onChange={(e) => setCountText(e.target.value.replace(/[^0-9]/g, ''))}
              className="tabular w-14 rounded-lg bg-transparent py-1 text-center text-[15px] font-bold outline-none"
            />
            <button
              type="button"
              onClick={() => bumpCount(1)}
              aria-label="加一份"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-lg leading-none text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              ＋
            </button>
            <span className="text-xs text-slate-400">份</span>
          </div>
          {/* 单个克数 */}
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-soft dark:bg-slate-900">
            <span className="w-8 text-xs text-slate-400">单个</span>
            <input
              type="number"
              min={1}
              value={perGText}
              onChange={(e) => setPerGText(e.target.value.replace(/[^0-9.]/g, ''))}
              className="tabular min-w-0 flex-1 rounded-lg bg-transparent py-1 text-center text-[15px] font-semibold outline-none"
            />
            <span className="text-xs text-slate-400">g</span>
          </div>
          {/* 合计 */}
          <div className="mt-2 flex items-center justify-between border-t border-slate-200/80 px-1 pt-2 text-xs dark:border-slate-700">
            <span className="tabular text-slate-400">
              共 {count}×{perG > 0 ? perG : 0} = {g > 0 ? g : 0}g
            </span>
            {preview && (
              <span className="tabular font-bold text-emerald-600 dark:text-emerald-300">
                约 {fmtKcal(preview.kcal)} kcal
              </span>
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {inCart != null && (
              <button
                type="button"
                onClick={() => onRemoveCart(food.id)}
                className="tap rounded-full px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-800"
              >
                ✕ 移出已选
              </button>
            )}
            {food.source === 'user' && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`删除自定义食物「${food.name}」？已记录的条目不受影响。`)) {
                    onRemoveFood(food)
                  }
                }}
                className="tap rounded-full px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                删除此食物
              </button>
            )}
            <button
              type="button"
              disabled={g <= 0}
              onClick={() => {
                if (g > 0) {
                  onAdd(food, count, perG)
                  setOpen(false)
                }
              }}
              className="tap ml-auto rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white shadow-soft transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 dark:from-emerald-500 dark:to-teal-500 dark:text-emerald-950"
            >
              {inCart != null
                ? `更新：${count} 份 × ${perG}g`
                : `加入已选：${count} 份 × ${perG}g`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateFoodForm({
  form,
  setForm,
  creating,
  onSubmit,
  onCancel,
}: {
  form: typeof EMPTY_FORM
  setForm: (f: typeof EMPTY_FORM) => void
  creating: boolean
  onSubmit: () => void
  onCancel: () => void
}) {
  const inputCls =
    'tap mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[15px] outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-soft dark:bg-slate-900">
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-lg dark:bg-emerald-400/10">
            ✍️
          </span>
          <div>
            <h4 className="text-[15px] font-semibold">新增自定义食物</h4>
            <p className="text-xs text-slate-400">
              按每 100g 营养填写（看包装成分表），建完自动进「我的」
            </p>
          </div>
        </div>

        <label className="mt-4 block text-sm font-medium text-slate-600 dark:text-slate-300">
          名称
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="如：妈妈牌红烧肉"
            className={inputCls}
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-slate-600 dark:text-slate-300">
          分类
          <select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value as FoodCategoryCode })
            }
            className={`${inputCls} bg-white dark:bg-slate-900`}
          >
            {CAT_META.map((c) => (
              <option key={c.code} value={c.code}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {(
            [
              ['kcal', '热量 kcal', '🔥'],
              ['carbs', '碳水 g', '🍚'],
              ['protein', '蛋白 g', '🥚'],
              ['fat', '脂肪 g', '🧈'],
            ] as const
          ).map(([key, label, icon]) => (
            <label key={key} className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              {icon} {label}
              <input
                type="number"
                min={0}
                step="0.1"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder="0"
                className={inputCls}
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="tap flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={creating || !form.name.trim()}
            className="tap flex-[1.6] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-lift transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50 dark:from-emerald-500 dark:to-teal-500 dark:text-emerald-950"
          >
            {creating ? '创建中…' : '创建并加入已选'}
          </button>
        </div>
      </div>
    </div>
  )
}
