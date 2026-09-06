import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { FoodsModule } from './foods/foods.module'
import { LogsModule } from './logs/logs.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    FoodsModule,
    LogsModule,
  ],
})
export class AppModule {}
