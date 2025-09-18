import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/user/decorators/user.decorator';
import { CategoryService } from './category.service';
import { CategoryDto } from './dto/category.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Auth()
  @Get('by-storeId/:storeId')
  async getByStoreId(@CurrentUser('id') userId: string, @Param('storeId') storeId: string) {
    return this.categoryService.getByStoreId(storeId, userId);
  }

  @Auth()
  @Get('by-id/:id')
  async getById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.categoryService.getById(id, userId);
  }

  @UsePipes(new ValidationPipe())
  @Auth()
  @HttpCode(200)
  @Post('/:storeId')
  async create(
    @CurrentUser('id') userId: string,
    @Param('storeId') storeId: string,
    @Body() dto: CategoryDto,
  ) {
    return this.categoryService.create(storeId, userId, dto);
  }

  @UsePipes(new ValidationPipe())
  @Auth()
  @HttpCode(200)
  @Put('/:id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CategoryDto,
  ) {
    return this.categoryService.update(id, userId, dto);
  }

  @Auth()
  @HttpCode(200)
  @Delete('/:id')
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.categoryService.delete(id, userId);
  }
}
