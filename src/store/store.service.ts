import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StoreStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  /* Seller: Mağaza başvurusu oluştur (status=PENDING) */
  async apply(ownerId: string, dto: CreateStoreDto) {
    const exists = await this.prisma.store.findFirst({ where: { ownerId } });
    if (exists) throw new BadRequestException('You already have a store');

    return this.prisma.store.create({
      data: {
        title: dto.title,
        description: dto.description,
        ownerId,
        status: StoreStatus.PENDING,
      },
    });
  }

  /* Genel/ Tek mağaza getir */
  async getStoreById(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: {
        id: storeId,
      },
      include: {
        products: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
          },
        },
      },
    });
    if (!store) throw new NotFoundException('Store not found !!');
    return store;
  }

  /* Genel/ADMIN: Tek mağaza getir kullanici vs 
  async findById(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true, fullName: true, roles: true } },
      },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }*/
  /* Seller: Tekrardan bsvuru */
  async reapplication(storeId: string, ownerId: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');
    if (store.ownerId !== ownerId) throw new ForbiddenException('Not your store');

    return this.prisma.store.update({
      where: { id: storeId },
      data: {
        status: StoreStatus.PENDING,
      },
    });
  }

  /* Seller: mağazasını güncelle (yalnız sahibi) */
  async updateAsOwner(storeId: string, ownerId: string, dto: UpdateStoreDto) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');
    if (store.ownerId !== ownerId) throw new ForbiddenException('Not your store');

    // PENDING veya APPROVED iken temel bilgileri güncellemeye izin verilebilir
    return this.prisma.store.update({
      where: { id: storeId },
      data: {
        title: dto.title ?? store.title,
        description: dto.description ?? store.description,
      },
    });
  }

  /* ADMIN: Onayla */
  async approve(storeId: string, adminId: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');
    if (store.status === StoreStatus.APPROVED) {
      throw new BadRequestException('Store already approved');
    }
    return this.prisma.store.update({
      where: { id: storeId },
      data: {
        status: StoreStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: adminId,
        rejectReason: null,
      },
    });
  }

  /* ADMIN: Reddet */
  async reject(storeId: string, adminId: string, rejectReason?: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');
    if (store.status === StoreStatus.REJECTED) {
      throw new BadRequestException('Store already rejected');
    }
    return this.prisma.store.update({
      where: { id: storeId },
      data: {
        status: StoreStatus.REJECTED,
        approvedAt: null,
        approvedById: adminId,
        rejectReason: rejectReason ?? 'Not specified',
      },
    });
  }

  /* ADMIN: PENDING başvuruları listele (opsiyonel) */
  async listPending() {
    return this.prisma.store.findMany({
      where: { status: StoreStatus.PENDING },
      orderBy: { createdAt: 'asc' },
    });
  }
}
