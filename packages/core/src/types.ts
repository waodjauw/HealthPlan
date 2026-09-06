export type FoodCategoryCode =
  | 'staple'
  | 'meat'
  | 'bean'
  | 'vegetable'
  | 'fruit'
  | 'dairy'
  | 'drink'
  | 'snack'
  | 'dish'

export type FoodSource = 'system' | 'user'

export interface NutritionPer100g {
  kcal: number
  carbs: number
  protein: number
  fat: number
}

export interface Serving {
  label: string
  grams: number
  isDefault?: boolean
}

export interface Food {
  id: string
  name: string
  aliases: string[]
  category: FoodCategoryCode
  per100g: NutritionPer100g
  servings: Serving[]
  source: FoodSource
  ownerId?: string
  origin?: string
  abbr?: string
  pinyin?: string
}

export interface FoodLog {
  id: string
  userId: string
  foodId: string
  grams: number
  date: string
}

export interface LogWithFood {
  log: FoodLog
  food: Food
}

export interface Nutrition {
  kcal: number
  carbs: number
  protein: number
  fat: number
}

export interface EnergyShare {
  carbs: number
  protein: number
  fat: number
}

export interface DailySummary {
  date: string
  total: Nutrition
  share: EnergyShare
}
