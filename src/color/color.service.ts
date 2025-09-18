import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ColorDto } from './dto/color.dto';

@Injectable()
export class ColorService {
  constructor(private prisma: PrismaService) {}

  async getByStoreId(storeId: string, userId: string) {
    return this.prisma.color.findMany({
      where: {
        storeId,
        store: { userId },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, userId: string) {
    const color = await this.prisma.color.findFirst({
      where: {
        id,
        store: { userId },
      },
    });
    if (!color) throw new NotFoundException('Color not found');
    return color;
  }

  async create(storeId: string, userId: string, dto: ColorDto) {
    const ownsStore = await this.prisma.store.count({
      where: { id: storeId, userId },
    });
    if (ownsStore === 0) {
      throw new ForbiddenException('You do not own this store');
    }

    return this.prisma.color.create({
      data: {
        name: dto.name,
        value: dto.value,
        storeId,
      },
    });
  }

  async update(id: string, userId: string, dto: ColorDto) {
    const res = await this.prisma.color.updateMany({
      where: {
        id,
        store: { userId },
      },
      data: {
        name: dto.name,
        value: dto.value,
      },
    });

    if (res.count === 0) throw new NotFoundException('Color not found');

    return this.prisma.color.findUnique({ where: { id } });
  }

  async delete(id: string, userId: string) {
    const res = await this.prisma.color.deleteMany({
      where: {
        id,
        store: { userId },
      },
    });

    if (res.count === 0) throw new NotFoundException('Color not found');
    return { ok: true };
  }
}
