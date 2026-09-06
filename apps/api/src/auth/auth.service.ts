import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcryptjs'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

export interface AuthUser {
  id: string
  email: string
  username: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private toAuthUser(row: {
    id: string
    email: string
    username: string
  }): AuthUser {
    return { id: row.id, email: row.email, username: row.username }
  }

  async register(dto: RegisterDto): Promise<{ token: string; user: AuthUser }> {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    })
    if (exists) {
      throw new ConflictException('邮箱或用户名已被注册')
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
      },
    })

    return {
      token: this.signToken(user.id, user.username),
      user: this.toAuthUser(user),
    }
  }

  async login(dto: LoginDto): Promise<{ token: string; user: AuthUser }> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.account }, { username: dto.account }] },
    })
    if (!user) {
      throw new UnauthorizedException('账号或密码错误')
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash)
    if (!ok) {
      throw new UnauthorizedException('账号或密码错误')
    }

    return {
      token: this.signToken(user.id, user.username),
      user: this.toAuthUser(user),
    }
  }

  private signToken(userId: string, username: string): string {
    return this.jwt.sign({ sub: userId, username }, { expiresIn: '30d' })
  }
}
