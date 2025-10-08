import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/user/decorators/user.decorator';
import { CreateStoreDto } from './dto/create-store.dto';
import { ReviewStoreApplicationDto } from './dto/review-store-application.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreService } from './store.service';

@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  /* SELLER: mağaza başvurusu oluşturur (status=PENDING) */ //✓
  @Auth(Role.SELLER)
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('create')
  async apply(@CurrentUser('id') ownerId: string, @Body() dto: CreateStoreDto) {
    return this.storeService.apply(ownerId, dto);
  }

  /* ALL Users: Magazayi gor (icindeki product ile beraber) */
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Get(':id')
  async getStoreById(@Param('id') id: string) {
    return this.storeService.getStoreById(id);
  }

  /* /ADMIN: tek mağaza 
  @Auth() // en az login
  @UsePipes(new ValidationPipe())
  @Get(':id')
  async byId(@Param('id') id: string) {
    return this.storeService.findById(id);
  }*/

  /* SELLER: kendi mağazasını günceller */
  @Auth(Role.SELLER)
  @Patch(':id')
  async updateMine(
    @Param('id') id: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storeService.updateAsOwner(id, ownerId, dto);
  }

  /*SELLER re-application yani tekrar bavuru*/
  @Auth(Role.SELLER)
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('re-application/:id')
  async reapplication(@Param('id') id: string, @CurrentUser('id') ownerId: string) {
    return this.storeService.reapplication(id, ownerId);
  }

  /* ADMIN: bekleyen başvuruları gör (opsiyonel) */ //✓
  @Auth(Role.ADMIN)
  @Get('admin/pending')
  async listPending() {
    return this.storeService.listPending();
  }

  /* ADMIN: onayla */ //✓
  @Auth(Role.ADMIN)
  @Post('admin/:id/approve')
  async approve(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.storeService.approve(id, adminId);
  }

  /* ADMIN: reddet */ //✓
  @Auth(Role.ADMIN)
  @Post('admin/:id/reject')
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() body: ReviewStoreApplicationDto,
  ) {
    return this.storeService.reject(id, adminId, body.rejectReason);
  }
}
