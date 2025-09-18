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
import { ColorService } from './color.service';
import { ColorDto } from './dto/color.dto';

@Controller('colors')
export class ColorController {
  constructor(private readonly colorService: ColorService) {}

  @Auth()
  @Get('by-storeId/:storId')
  async getByStoreId(@CurrentUser('id') userId: string, @Param('storId') storeId: string) {
    return this.colorService.getByStoreId(storeId, userId);
  }

  @Auth()
  @Get('by-id/:id')
  async getById(@CurrentUser('id') userId: string, @Param('id') colorId: string) {
    return this.colorService.getById(colorId, userId);
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Auth()
  @Post(':storeId')
  async create(
    @CurrentUser('id') userId: string,
    @Param('storeId') storeId: string,
    @Body() dto: ColorDto,
  ) {
    return this.colorService.create(storeId, userId, dto);
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Auth()
  @Put(':id')
  async update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: ColorDto) {
    return this.colorService.update(id, userId, dto);
  }

  @HttpCode(200)
  @Auth()
  @Delete(':id')
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.colorService.delete(id, userId);
  }
}
