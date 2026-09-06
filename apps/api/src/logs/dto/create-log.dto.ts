import { IsNumber, IsString, Matches, Min, MinLength } from 'class-validator'

export class CreateLogDto {
  @IsString()
  @MinLength(1)
  foodId: string

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式应为 YYYY-MM-DD' })
  date: string

  @IsNumber()
  @Min(0.1)
  grams: number
}
