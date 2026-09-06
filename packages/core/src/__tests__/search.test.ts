import { describe, expect, it } from 'vitest'
import { BUILTIN_FOODS } from '../data/foods'
import { filterByCategory, searchFoods } from '../search'
import type { Food } from '../types'

const sample: Food[] = [
  {
    id: 'rice',
    name: '米饭（蒸）',
    aliases: ['白米饭'],
    category: 'staple',
    per100g: { kcal: 116, carbs: 25.9, protein: 2.6, fat: 0.3 },
    servings: [],
    source: 'system',
    abbr: 'mf',
    pinyin: 'mifan',
  },
  {
    id: 'tomato',
    name: '番茄',
    aliases: ['西红柿'],
    category: 'vegetable',
    per100g: { kcal: 15, carbs: 3.3, protein: 0.9, fat: 0.2 },
    servings: [],
    source: 'system',
    abbr: 'fq',
    pinyin: 'fanqie',
  },
  {
    id: 'kfc-burger',
    name: 'KFC 新奥尔良烤鸡腿堡',
    aliases: ['肯德基汉堡', 'KFC'],
    category: 'dish',
    per100g: { kcal: 252, carbs: 24, protein: 13, fat: 11 },
    servings: [],
    source: 'system',
  },
]

describe('searchFoods', () => {
  it('按名称命中', () => {
    expect(searchFoods(sample, '米饭')[0]?.id).toBe('rice')
  })

  it('按别名命中', () => {
    expect(searchFoods(sample, '西红柿')[0]?.id).toBe('tomato')
  })

  it('完全匹配排在包含匹配之前', () => {
    const result = searchFoods(BUILTIN_FOODS, '米饭')
    expect(result[0]?.name).toBe('米饭（蒸）')
  })

  it('支持拼音首字母', () => {
    expect(searchFoods(sample, 'fq')[0]?.id).toBe('tomato')
  })

  it('支持全拼', () => {
    expect(searchFoods(sample, 'fanqie')[0]?.id).toBe('tomato')
  })

  it('英文关键词大小写不敏感', () => {
    expect(searchFoods(sample, 'kfc')[0]?.id).toBe('kfc-burger')
  })

  it('空关键词返回全部且按名称排序', () => {
    const result = searchFoods(sample, '   ')
    expect(result).toHaveLength(3)
    expect(result.map((f) => f.id)).toEqual(['tomato', 'rice', 'kfc-burger'])
  })

  it('无匹配时返回空数组', () => {
    expect(searchFoods(sample, '不存在的食物')).toEqual([])
  })

  it('limit 生效', () => {
    expect(searchFoods(BUILTIN_FOODS, '鸡', { limit: 3 })).toHaveLength(3)
  })

  it('可按分类过滤', () => {
    const result = searchFoods(BUILTIN_FOODS, '', { category: 'fruit' })
    expect(result.length).toBeGreaterThan(10)
    expect(result.every((f) => f.category === 'fruit')).toBe(true)
  })

  it('搜索与分类过滤可叠加', () => {
    const result = searchFoods(sample, '番茄', { category: 'staple' })
    expect(result).toEqual([])
  })
})

describe('filterByCategory', () => {
  it('只返回指定分类', () => {
    expect(filterByCategory(sample, 'vegetable').map((f) => f.id)).toEqual(['tomato'])
  })
})

describe('内置数据集', () => {
  it('条目数量在 150 到 250 之间', () => {
    expect(BUILTIN_FOODS.length).toBeGreaterThanOrEqual(150)
    expect(BUILTIN_FOODS.length).toBeLessThanOrEqual(250)
  })

  it('id 唯一', () => {
    const ids = new Set(BUILTIN_FOODS.map((f) => f.id))
    expect(ids.size).toBe(BUILTIN_FOODS.length)
  })

  it('名称唯一', () => {
    const names = new Set(BUILTIN_FOODS.map((f) => f.name))
    expect(names.size).toBe(BUILTIN_FOODS.length)
  })

  it('每个食物都至少有一个份量且克数为正数', () => {
    for (const food of BUILTIN_FOODS) {
      expect(food.servings.length).toBeGreaterThan(0)
      expect(food.servings.every((s) => s.grams > 0)).toBe(true)
      expect(food.servings.filter((s) => s.isDefault).length).toBeLessThanOrEqual(1)
    }
  })

  it('营养数值非负且有限', () => {
    for (const food of BUILTIN_FOODS) {
      const { kcal, carbs, protein, fat } = food.per100g
      for (const value of [kcal, carbs, protein, fat]) {
        expect(Number.isFinite(value)).toBe(true)
        expect(value).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('热量与三大营养素换算自洽（酒精与低热量饮品豁免）', () => {
    const exempt = new Set(['drink-baijiu', 'drink-wine', 'drink-beer'])
    for (const food of BUILTIN_FOODS) {
      if (exempt.has(food.id) || food.per100g.kcal < 50) continue
      const fromMacro = food.per100g.carbs * 4 + food.per100g.protein * 4 + food.per100g.fat * 9
      const diff = Math.abs(fromMacro - food.per100g.kcal)
      const relative = diff / food.per100g.kcal
      expect(
        relative <= 0.3 || diff <= 80,
        `${food.name} 热量 ${food.per100g.kcal} 与宏量换算 ${Math.round(fromMacro)} 偏差过大`,
      ).toBe(true)
    }
  })
})
