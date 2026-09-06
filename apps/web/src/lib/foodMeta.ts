import type { FoodCategoryCode } from '@healthplan/core'

export interface CategoryMeta {
  code: FoodCategoryCode
  label: string
  icon: string
  /** 彩色圆片：底/前景，含暗色 */
  chip: string
  /** 食品卡行首的小圆片色 */
  tile: string
}

export const CAT_META: CategoryMeta[] = [
  { code: 'staple', label: '主食谷薯', icon: '🍚', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300', tile: 'bg-amber-50 dark:bg-amber-400/10' },
  { code: 'meat', label: '肉禽蛋', icon: '🍗', chip: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300', tile: 'bg-rose-50 dark:bg-rose-400/10' },
  { code: 'bean', label: '水产豆制', icon: '🐟', chip: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300', tile: 'bg-sky-50 dark:bg-sky-400/10' },
  { code: 'vegetable', label: '蔬菜菌菇', icon: '🥦', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300', tile: 'bg-emerald-50 dark:bg-emerald-400/10' },
  { code: 'fruit', label: '水果', icon: '🍎', chip: 'bg-pink-100 text-pink-700 dark:bg-pink-400/15 dark:text-pink-300', tile: 'bg-pink-50 dark:bg-pink-400/10' },
  { code: 'dairy', label: '奶制品', icon: '🥛', chip: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300', tile: 'bg-cyan-50 dark:bg-cyan-400/10' },
  { code: 'drink', label: '饮品', icon: '🧃', chip: 'bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300', tile: 'bg-violet-50 dark:bg-violet-400/10' },
  { code: 'snack', label: '坚果零食', icon: '🥜', chip: 'bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300', tile: 'bg-orange-50 dark:bg-orange-400/10' },
  { code: 'dish', label: '成品菜', icon: '🍲', chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300', tile: 'bg-indigo-50 dark:bg-indigo-400/10' },
]

const META_BY_CODE = new Map<FoodCategoryCode, CategoryMeta>(CAT_META.map((m) => [m.code, m]))

export function catMeta(code: string): CategoryMeta {
  return META_BY_CODE.get(code as FoodCategoryCode) ?? CAT_META[CAT_META.length - 1]
}

export function catIcon(code: string): string {
  return catMeta(code).icon
}
