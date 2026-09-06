import { IsString, MinLength } from 'class-validator'

export class LoginDto {
  // 邮箱或用户名
  @IsString()
  @MinLength(3)
  account: string

  @IsString()
  @MinLength(6)
  password: string
}
