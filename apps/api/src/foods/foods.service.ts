import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import {
  BUILTIN_FOODS,
  searchFoods,
  type Food,
  type FoodCategoryCode,
  type FoodSource,
  type NutritionPer100g,
  type Serving,
} from '@healthplan/core'
import { CreateFoodDto } from './dto/create-food.dto'
import { UpdateFoodDto } from './dto/update-food.dto'

type FoodRow = {
  id: string
  name: string
  aliases: string[]
  category: string
  per100g: unknown
  servings: unknown
  source: string
  ownerId: string | null
  origin: string | null
}

@Injectable()
export class FoodsService {
  constructor(private readonly prisma: PrismaService) {}

  getSystemFoods(): Food[] {
    return BUILTIN_FOODS
  }

  async search(
    query: string,
    category?: string,
    userId?: string,
  ): Promise<Food[]> {
    const userFoods = userId ? await this.listUserFoods(userId) : []
    const merged = [...BUILTIN_FOODS, ...userFoods]
    return searchFoods(
      merged,
      query ?? '',
      category ? { category: category as FoodCategoryCode } : {},
    )
  }

  // 解析任意食物：系统库优先，其次用户自定义（需归属校验）
  async resolveFood(id: string, userId?: string): Promise<Food | null> {
    const builtin = BUILTIN_FOODS.find((food) => food.id === id)
    if (builtin) return builtin
    if (!userId) return null
    const row = await this.prisma.food.findFirst({
      where: { id, ownerId: userId },
    })
    return row ? this.toCore(row as unknown as FoodRow) : null
  }

  async listUserFoods(userId: string): Promise<Food[]> {
    const rows = await this.prisma.food.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((row) => this.toCore(row as unknown as FoodRow))
  }

  async getUserFood(id: string, userId: string): Promise<Food> {
    const row = await this.prisma.food.findFirst({
      where: { id, ownerId: userId },
    })
    if (!row) throw new NotFoundException('食物不存在')
    return this.toCore(row as unknown as FoodRow)
  }

  async create(dto: CreateFoodDto, userId: string): Promise<Food> {
    const row = await this.prisma.food.create({
      data: {
        name: dto.name,
        aliases: dto.aliases ?? [],
        category: dto.category,
        per100g: dto.per100g as unknown as Prisma.InputJsonValue,
        servings: (dto.servings ?? []) as unknown as Prisma.InputJsonValue,
        source: 'user',
        ownerId: userId,
        origin: dto.origin,
      },
    })
    return this.toCore(row as unknown as FoodRow)
  }

  async update(id: string, dto: UpdateFoodDto, userId: string): Promise<Food> {
    const existing = await this.prisma.food.findFirst({
      where: { id, ownerId: userId },
    })
    if (!existing) throw new NotFoundException('食物不存在')

    const row = await this.prisma.food.update({
      where: { id },
      data: {
        name: dto.name,
        aliases: dto.aliases,
        category: dto.category,
        per100g: dto.per100g as unknown as Prisma.InputJsonValue,
        servings: dto.servings as unknown as Prisma.InputJsonValue,
        origin: dto.origin,
      },
    })
    return this.toCore(row as unknown as FoodRow)
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.food.findFirst({
      where: { id, ownerId: userId },
    })
    if (!existing) throw new NotFoundException('食物不存在')
    await this.prisma.food.delete({ where: { id } })
  }

  private toCore(row: FoodRow): Food {
    return {
      id: row.id,
      name: row.name,
      aliases: row.aliases ?? [],
      category: row.category as FoodCategoryCode,
      per100g: row.per100g as NutritionPer100g,
      servings: (row.servings as Serving[]) ?? [],
      source: (row.source as FoodSource) ?? 'user',
      ownerId: row.ownerId ?? undefined,
      origin: row.origin ?? undefined,
    }
  }
}
