import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { CATEGORIES } from '@healthplan/core'

const CATEGORY_CODES = CATEGORIES.map((item) => item.code) as [string, ...string[]]

export class NutritionPer100gDto {
  @IsNumber()
  @Min(0)
  kcal: number

  @IsNumber()
  @Min(0)
  carbs: number

  @IsNumber()
  @Min(0)
  protein: number

  @IsNumber()
  @Min(0)
  fat: number
}

export class ServingDto {
  @IsString()
  @MinLength(1)
  label: string

  @IsNumber()
  @Min(0)
  grams: number

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean
}

export class CreateFoodDto {
  @IsString()
  @MinLength(1)
  name: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[]

  @IsString()
  @IsIn(CATEGORY_CODES)
  category: string

  @ValidateNested()
  @Type(() => NutritionPer100gDto)
  per100g: NutritionPer100gDto

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServingDto)
  servings?: ServingDto[]

  @IsOptional()
  @IsString()
  origin?: string
}
