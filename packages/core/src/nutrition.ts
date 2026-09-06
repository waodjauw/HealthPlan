import { DEFAULT_GRAMS, KCAL_PER_GRAM } from './constants'
import type {
  DailySummary,
  EnergyShare,
  LogWithFood,
  Nutrition,
  NutritionPer100g,
  Serving,
} from './types'

const EPSILON = 1e-9

export function roundKcal(value: number): number {
  return Math.round(value + EPSILON)
}

export function roundMacro(value: number): number {
  return Math.round((value + EPSILON) * 10) / 10
}

export function calcNutrition(per100g: NutritionPer100g, grams: number): Nutrition {
  const safeGrams = Number.isFinite(grams) && grams > 0 ? grams : 0
  const ratio = safeGrams / 100
  return {
    kcal: roundKcal(per100g.kcal * ratio),
    carbs: roundMacro(per100g.carbs * ratio),
    protein: roundMacro(per100g.protein * ratio),
    fat: roundMacro(per100g.fat * ratio),
  }
}

export function sumNutrition(items: Nutrition[]): Nutrition {
  const acc: Nutrition = { kcal: 0, carbs: 0, protein: 0, fat: 0 }
  for (const item of items) {
    acc.kcal += item.kcal
    acc.carbs += item.carbs
    acc.protein += item.protein
    acc.fat += item.fat
  }
  return {
    kcal: roundKcal(acc.kcal),
    carbs: roundMacro(acc.carbs),
    protein: roundMacro(acc.protein),
    fat: roundMacro(acc.fat),
  }
}

export function calcEnergyShare(nutrition: Nutrition): EnergyShare {
  const carbs = nutrition.carbs * KCAL_PER_GRAM.carbs
  const protein = nutrition.protein * KCAL_PER_GRAM.protein
  const fat = nutrition.fat * KCAL_PER_GRAM.fat
  const total = carbs + protein + fat
  if (total <= 0) {
    return { carbs: 0, protein: 0, fat: 0 }
  }
  const raw = {
    carbs: (carbs / total) * 100,
    protein: (protein / total) * 100,
    fat: (fat / total) * 100,
  }
  const share: EnergyShare = {
    carbs: Math.round(raw.carbs),
    protein: Math.round(raw.protein),
    fat: Math.round(raw.fat),
  }
  const diff = 100 - (share.carbs + share.protein + share.fat)
  if (diff !== 0) {
    const biggest: keyof EnergyShare =
      raw.carbs >= raw.protein && raw.carbs >= raw.fat
        ? 'carbs'
        : raw.protein >= raw.fat
          ? 'protein'
          : 'fat'
    share[biggest] += diff
  }
  return share
}

export function getDefaultGrams(servings: Serving[]): number {
  const preferred = servings.find((item) => item.isDefault) ?? servings[0]
  return preferred ? preferred.grams : DEFAULT_GRAMS
}

export function summarizeDay(entries: LogWithFood[], date: string): DailySummary {
  const total = sumNutrition(
    entries.map((item) => calcNutrition(item.food.per100g, item.log.grams)),
  )
  return {
    date,
    total,
    share: calcEnergyShare(total),
  }
}

export function todayISODate(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
