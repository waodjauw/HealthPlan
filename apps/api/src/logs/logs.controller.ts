import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { LogsService } from './logs.service'
import { CreateLogDto } from './dto/create-log.dto'
import { UpdateLogDto } from './dto/update-log.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator'

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(private readonly logs: LogsService) {}

  @Post()
  create(@Body() dto: CreateLogDto, @CurrentUser() user: RequestUser) {
    return this.logs.create(dto, user.id)
  }

  @Get()
  list(
    @Query('date') date: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.logs.listByDate(user.id, date)
  }

  @Get('range')
  range(
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.logs.listRange(user.id, from, to)
  }

  @Get('summary')
  summary(
    @Query('date') date: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.logs.summary(user.id, date)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLogDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.logs.update(id, dto, user.id)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.logs.remove(id, user.id)
  }
}
