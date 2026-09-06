import { IsNumber, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator'

export class UpdateLogDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  foodId?: string

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式应为 YYYY-MM-DD' })
  date?: string

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  grams?: number
}
