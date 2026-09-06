import type { Food, FoodCategoryCode } from './types'

export interface SearchOptions {
  limit?: number
  category?: FoodCategoryCode
}

function normalize(value: string): string {
  return value.toLowerCase().trim()
}

function scoreFood(food: Food, query: string): number {
  const name = normalize(food.name)
  if (name === query) return 100
  if (name.startsWith(query)) return 85
  if (name.includes(query)) return 70

  for (const alias of food.aliases) {
    const value = normalize(alias)
    if (value === query) return 80
    if (value.startsWith(query)) return 65
    if (value.includes(query)) return 55
  }

  if (food.abbr) {
    for (const item of food.abbr.split(' ')) {
      const abbr = normalize(item)
      if (abbr === query) return 60
      if (abbr.startsWith(query)) return 45
    }
  }

  if (food.pinyin) {
    for (const item of food.pinyin.split(' ')) {
      if (normalize(item).startsWith(query)) return 30
    }
  }

  return 0
}

function compareByName(a: Food, b: Food): number {
  return a.name.localeCompare(b.name, 'zh-Hans-CN')
}

export function searchFoods(foods: Food[], query: string, options: SearchOptions = {}): Food[] {
  const scoped = options.category
    ? foods.filter((food) => food.category === options.category)
    : foods

  const keyword = normalize(query)
  if (!keyword) {
    const sorted = [...scoped].sort(compareByName)
    return options.limit ? sorted.slice(0, options.limit) : sorted
  }

  const scored = scoped
    .map((food) => ({ food, score: scoreFood(food, keyword) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || compareByName(a.food, b.food))
    .map((item) => item.food)

  return options.limit ? scored.slice(0, options.limit) : scored
}

export function filterByCategory(foods: Food[], category: FoodCategoryCode): Food[] {
  return foods.filter((food) => food.category === category)
}
