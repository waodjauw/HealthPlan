import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type {
  DailySummary,
  Food,
  FoodCategoryCode,
  Nutrition,
} from '@healthplan/core'
import { API_BASE } from '../config'

export const TOKEN_KEY = 'hp_token'

export const api = axios.create({ baseURL: API_BASE, timeout: 15000 })

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY)
    }
    return Promise.reject(error)
  },
)

export interface AuthUser {
  id: string
  email: string
  username: string
}

export interface AuthResult {
  token: string
  user: AuthUser
}

export const authApi = {
  async register(email: string, username: string, password: string) {
    const { data } = await api.post<AuthResult>('/auth/register', {
      email,
      username,
      password,
    })
    return data
  },
  async login(account: string, password: string) {
    const { data } = await api.post<AuthResult>('/auth/login', { account, password })
    return data
  },
  async me() {
    const { data } = await api.get<{ user: AuthUser }>('/auth/me')
    return data.user
  },
}

export const foodsApi = {
  async builtin() {
    const { data } = await api.get<Food[]>('/foods/builtin')
    return data
  },
  async search(q: string, category?: FoodCategoryCode) {
    const { data } = await api.get<Food[]>('/foods/search', { params: { q, category } })
    return data
  },
  async myFoods() {
    const { data } = await api.get<Food[]>('/foods/me')
    return data
  },
  async create(payload: {
    name: string
    aliases?: string[]
    category: FoodCategoryCode
    per100g: Nutrition
    servings?: { label: string; grams: number; isDefault?: boolean }[]
    origin?: string
  }) {
    const { data } = await api.post<Food>('/foods', payload)
    return data
  },
  async remove(id: string) {
    await api.delete(`/foods/me/${id}`)
  },
}

export interface LogItem {
  id: string
  foodId: string
  foodName: string
  category: string
  date: string
  grams: number
  nutrition: Nutrition
  createdAt: string
}

export const logsApi = {
  async list(date: string) {
    const { data } = await api.get<LogItem[]>('/logs', { params: { date } })
    return data
  },
  async create(payload: {
    foodId: string
    date: string
    grams: number
  }) {
    const { data } = await api.post<LogItem>('/logs', payload)
    return data
  },
  async remove(id: string) {
    await api.delete(`/logs/${id}`)
  },
  async summary(date: string) {
    const { data } = await api.get<DailySummary>('/logs/summary', { params: { date } })
    return data
  },
}
