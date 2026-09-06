import type { FoodCategoryCode } from './types'

export interface CategoryMeta {
  code: FoodCategoryCode
  label: string
}

export const CATEGORIES: CategoryMeta[] = [
  { code: 'staple', label: '主食谷薯' },
  { code: 'meat', label: '肉禽蛋' },
  { code: 'bean', label: '水产豆制' },
  { code: 'vegetable', label: '蔬菜菌菇' },
  { code: 'fruit', label: '水果' },
  { code: 'dairy', label: '奶制品' },
  { code: 'drink', label: '饮品' },
  { code: 'snack', label: '坚果零食' },
  { code: 'dish', label: '成品菜' },
]

const CATEGORY_LABELS = new Map<FoodCategoryCode, string>(
  CATEGORIES.map((item) => [item.code, item.label]),
)

export function getCategoryLabel(code: FoodCategoryCode): string {
  return CATEGORY_LABELS.get(code) ?? '其他'
}

export const KCAL_PER_GRAM = {
  carbs: 4,
  protein: 4,
  fat: 9,
} as const

export const DEFAULT_GRAMS = 100
