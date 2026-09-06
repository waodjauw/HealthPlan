import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { FoodsService } from '../foods/foods.service'
import {
  calcEnergyShare,
  calcNutrition,
  sumNutrition,
  type DailySummary,
  type Food,
  type Nutrition,
} from '@healthplan/core'
import { CreateLogDto } from './dto/create-log.dto'
import { UpdateLogDto } from './dto/update-log.dto'

type LogRow = {
  id: string
  userId: string
  foodId: string
  foodName: string
  category: string
  date: string
  grams: number
  nutrition: unknown
  createdAt: Date
}

export interface LogResponse {
  id: string
  foodId: string
  foodName: string
  category: string
  date: string
  grams: number
  nutrition: Nutrition
  createdAt: string
}

@Injectable()
export class LogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly foods: FoodsService,
  ) {}

  async create(dto: CreateLogDto, userId: string): Promise<LogResponse> {
    const food = await this.foods.resolveFood(dto.foodId, userId)
    if (!food) throw new NotFoundException('食物不存在')

    const nutrition = calcNutrition(food.per100g, dto.grams)
    const log = await this.prisma.foodLog.create({
      data: {
        userId,
        foodId: dto.foodId,
        foodName: food.name,
        category: food.category,
        date: dto.date,
        grams: dto.grams,
        nutrition: nutrition as unknown as Prisma.InputJsonValue,
      },
    })
    return this.toResponse(log as unknown as LogRow)
  }

  async listByDate(userId: string, date: string): Promise<LogResponse[]> {
    const rows = await this.prisma.foodLog.findMany({
      where: { userId, date },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map((row) => this.toResponse(row as unknown as LogRow))
  }

  async listRange(
    userId: string,
    from: string,
    to: string,
  ): Promise<LogResponse[]> {
    const rows = await this.prisma.foodLog.findMany({
      where: { userId, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    })
    return rows.map((row) => this.toResponse(row as unknown as LogRow))
  }

  async summary(userId: string, date: string): Promise<DailySummary> {
    const rows = await this.prisma.foodLog.findMany({
      where: { userId, date },
      orderBy: { createdAt: 'asc' },
    })
    const total = sumNutrition(
      rows.map((row) => row.nutrition as unknown as Nutrition),
    )
    return { date, total, share: calcEnergyShare(total) }
  }

  async update(id: string, dto: UpdateLogDto, userId: string): Promise<LogResponse> {
    const existing = await this.prisma.foodLog.findFirst({
      where: { id, userId },
    })
    if (!existing) throw new NotFoundException('记录不存在')

    const foodId = dto.foodId ?? existing.foodId
    const grams = dto.grams ?? existing.grams
    const food: Food | null = await this.foods.resolveFood(foodId, userId)
    if (!food) throw new NotFoundException('食物不存在')

    const log = await this.prisma.foodLog.update({
      where: { id },
      data: {
        foodId,
        foodName: food.name,
        category: food.category,
        date: dto.date ?? existing.date,
        grams,
        nutrition: calcNutrition(food.per100g, grams) as unknown as Prisma.InputJsonValue,
      },
    })
    return this.toResponse(log as unknown as LogRow)
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.foodLog.findFirst({
      where: { id, userId },
    })
    if (!existing) throw new NotFoundException('记录不存在')
    await this.prisma.foodLog.delete({ where: { id } })
  }

  private toResponse(row: LogRow): LogResponse {
    return {
      id: row.id,
      foodId: row.foodId,
      foodName: row.foodName,
      category: row.category,
      date: row.date,
      grams: row.grams,
      nutrition: row.nutrition as Nutrition,
      createdAt: row.createdAt.toISOString(),
    }
  }
}
