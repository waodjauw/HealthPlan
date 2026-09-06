import { IsEmail, IsString, MinLength, Matches } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username: string

  @IsString()
  @MinLength(6)
  password: string
}
