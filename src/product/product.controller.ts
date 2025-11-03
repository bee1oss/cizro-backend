import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/user/decorators/user.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /* PUBLIC */
  @Get() //getting list testd
  listPublic(@Query() q: QueryProductDto) {
    return this.productService.listPublic(q);
  }

  @Get(':id') //tested
  byId(@Param('id') id: string) {
    return this.productService.byIdPublic(id);
  }

  /* SELLER */
  @Auth(Role.SELLER) //tested
  @Post()
  create(@CurrentUser('id') actorId: string, @Body() dto: CreateProductDto) {
    return this.productService.createBySeller(actorId, dto);
  }

  @Auth(Role.SELLER) //tested
  @Patch(':id')
  update(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.updateAsOwner(actorId, id, dto);
  }

  @Auth(Role.SELLER) //tested
  @Get('me/list')
  listMine(@CurrentUser('id') actorId: string, @Query('storeId') storeId?: string) {
    return this.productService.listMine(actorId, storeId);
  }

  /* ADMIN moderation */
  @Auth(Role.ADMIN) //tested
  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.productService.approve(id, adminId);
  }

  @Auth(Role.ADMIN) //tested
  @Post(':id/reject')
  reject(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.productService.reject(id, adminId);
  }
}
