import { describe, expect, it } from 'vitest'
import {
  calcEnergyShare,
  calcNutrition,
  getDefaultGrams,
  sumNutrition,
  summarizeDay,
  todayISODate,
} from '../nutrition'
import type { Food, LogWithFood } from '../types'

const rice: Food = {
  id: 'rice',
  name: '米饭（蒸）',
  aliases: ['白米饭'],
  category: 'staple',
  per100g: { kcal: 116, carbs: 25.9, protein: 2.6, fat: 0.3 },
  servings: [
    { label: '一小碗', grams: 150 },
    { label: '一碗', grams: 200, isDefault: true },
  ],
  source: 'system',
}

function makeLog(food: Food, grams: number, seq: number): LogWithFood {
  return {
    food,
    log: { id: `log-${seq}`, userId: 'u1', foodId: food.id, grams, date: '2026-09-05' },
  }
}

describe('calcNutrition', () => {
  it('100 克时等于每 100g 数值', () => {
    expect(calcNutrition(rice.per100g, 100)).toEqual({ kcal: 116, carbs: 25.9, protein: 2.6, fat: 0.3 })
  })

  it('按比例换算克数', () => {
    expect(calcNutrition(rice.per100g, 200)).toEqual({ kcal: 232, carbs: 51.8, protein: 5.2, fat: 0.6 })
  })

  it('奇数克数时热量取整、宏量保留一位小数', () => {
    const result = calcNutrition({ kcal: 130, carbs: 8, protein: 12, fat: 7 }, 333)
    expect(result.kcal).toBe(433)
    expect(result.carbs).toBe(26.6)
    expect(result.protein).toBe(40)
    expect(result.fat).toBe(23.3)
  })

  it('克数为 0 或负数时返回全 0，不产生 NaN', () => {
    expect(calcNutrition(rice.per100g, 0)).toEqual({ kcal: 0, carbs: 0, protein: 0, fat: 0 })
    expect(calcNutrition(rice.per100g, -100)).toEqual({ kcal: 0, carbs: 0, protein: 0, fat: 0 })
    expect(calcNutrition(rice.per100g, Number.NaN)).toEqual({ kcal: 0, carbs: 0, protein: 0, fat: 0 })
  })
})

describe('sumNutrition', () => {
  it('空列表返回全 0', () => {
    expect(sumNutrition([])).toEqual({ kcal: 0, carbs: 0, protein: 0, fat: 0 })
  })

  it('多条累加后仍然只保留一位小数', () => {
    const sum = sumNutrition([
      { kcal: 232, carbs: 51.8, protein: 5.2, fat: 0.6 },
      { kcal: 72, carbs: 0.7, protein: 6.7, fat: 4.4 },
    ])
    expect(sum).toEqual({ kcal: 304, carbs: 52.5, protein: 11.9, fat: 5 })
  })
})

describe('calcEnergyShare', () => {
  it('按 4 / 4 / 9 换算供能占比且总和为 100', () => {
    const share = calcEnergyShare({ kcal: 185, carbs: 25, protein: 10, fat: 5 })
    expect(share).toEqual({ carbs: 54, protein: 22, fat: 24 })
    expect(share.carbs + share.protein + share.fat).toBe(100)
  })

  it('全为 0 时不产生除零错误', () => {
    expect(calcEnergyShare({ kcal: 0, carbs: 0, protein: 0, fat: 0 })).toEqual({ carbs: 0, protein: 0, fat: 0 })
  })

  it('只有碳水时占比 100', () => {
    expect(calcEnergyShare({ kcal: 100, carbs: 25, protein: 0, fat: 0 })).toEqual({ carbs: 100, protein: 0, fat: 0 })
  })
})

describe('getDefaultGrams', () => {
  it('优先返回标记为默认的份量', () => {
    expect(getDefaultGrams(rice.servings)).toBe(200)
  })

  it('没有默认份量时取第一个', () => {
    expect(getDefaultGrams([{ label: '一份', grams: 120 }])).toBe(120)
  })

  it('没有份量时回退到 100 克', () => {
    expect(getDefaultGrams([])).toBe(100)
  })
})

describe('summarizeDay', () => {
  it('汇总当日全部记录的总量与供能占比', () => {
    const chicken: Food = {
      id: 'chicken',
      name: '宫保鸡丁',
      aliases: [],
      category: 'dish',
      per100g: { kcal: 130, carbs: 8, protein: 12, fat: 7 },
      servings: [{ label: '一份', grams: 300, isDefault: true }],
      source: 'system',
    }
    const summary = summarizeDay(
      [makeLog(rice, 200, 1), makeLog(chicken, 300, 2), makeLog(rice, 150, 3)],
      '2026-09-05',
    )

    expect(summary.date).toBe('2026-09-05')
    expect(summary.total).toEqual({ kcal: 796, carbs: 114.7, protein: 45.1, fat: 22.1 })
    expect(summary.share.carbs + summary.share.protein + summary.share.fat).toBe(100)
  })

  it('无记录时总与占比都为 0', () => {
    const summary = summarizeDay([], '2026-09-05')
    expect(summary.total).toEqual({ kcal: 0, carbs: 0, protein: 0, fat: 0 })
    expect(summary.share).toEqual({ carbs: 0, protein: 0, fat: 0 })
  })
})

describe('todayISODate', () => {
  it('按本地时区输出 YYYY-MM-DD', () => {
    expect(todayISODate(new Date(2026, 8, 5, 23, 59))).toBe('2026-09-05')
    expect(todayISODate(new Date(2026, 0, 1, 0, 1))).toBe('2026-01-01')
  })
})
