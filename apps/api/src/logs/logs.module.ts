import { Module } from '@nestjs/common'
import { LogsService } from './logs.service'
import { LogsController } from './logs.controller'
import { FoodsModule } from '../foods/foods.module'

@Module({
  imports: [FoodsModule],
  controllers: [LogsController],
  providers: [LogsService],
})
export class LogsModule {}
