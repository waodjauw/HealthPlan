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
import { FoodsService } from './foods.service'
import { CreateFoodDto } from './dto/create-food.dto'
import { UpdateFoodDto } from './dto/update-food.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator'

@Controller('foods')
export class FoodsController {
  constructor(private readonly foods: FoodsService) {}

  // 系统内置食物（无需登录即可浏览，方便前端预加载）
  @Get('builtin')
  builtin() {
    return this.foods.getSystemFoods()
  }

  // 搜索：合并系统库 + 当前用户自定义
  @Get('search')
  @UseGuards(JwtAuthGuard)
  search(
    @Query('q') q = '',
    @Query('category') category: string | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    return this.foods.search(q, category, user.id)
  }

  // 当前用户自定义食物列表
  @Get('me')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: RequestUser) {
    return this.foods.listUserFoods(user.id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateFoodDto, @CurrentUser() user: RequestUser) {
    return this.foods.create(dto, user.id)
  }

  @Get('me/:id')
  @UseGuards(JwtAuthGuard)
  mineOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.foods.getUserFood(id, user.id)
  }

  @Patch('me/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFoodDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.foods.update(id, dto, user.id)
  }

  @Delete('me/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.foods.remove(id, user.id)
  }

  // 解析任意食物（记日志前调用）：系统库或自己的自定义
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  resolve(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.foods.resolveFood(id, user.id)
  }
}
