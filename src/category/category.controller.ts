import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categories: CategoryService) {}

  // Yalnızca ADMIN ekleyebilir
  @Auth(Role.ADMIN)
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  // Yalnızca ADMIN güncelleyebilir
  @Auth(Role.ADMIN)
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  // Yalnızca ADMIN silebilir
  @Auth(Role.ADMIN)
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categories.remove(id);
  }

  // olan herkes görebilir

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.categories.findById(id);
  }

  // Ağaç görünüm (root -> children -> ...)

  @Get()
  list(@Query('parentId') parentId?: string) {
    if (typeof parentId !== 'undefined') {
      return this.categories.list(parentId === 'null' ? null : parentId);
    }
    return this.categories.tree();
  }
}
