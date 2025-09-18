import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async getByStoreId(storeId: string, userId: string) {
    return this.prisma.category.findMany({
      where: {
        storeId,
        store: { userId },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, userId: string) {
    const category = this.prisma.category.findUnique({
      where: {
        id,
        store: { userId },
      },
    });
    if (!category) throw new NotFoundException('Category not found');

    return category;
  }

  async create(storeId: string, userId: string, dto: CategoryDto) {
    const ownsStore = await this.prisma.store.count({
      where: { id: storeId, userId },
    });

    if (ownsStore === 0) {
      throw new ForbiddenException('You do not own this store');
    }

    return this.prisma.category.create({
      data: {
        title: dto.title,
        description: dto.description,
        storeId,
      },
    });
  }

  async update(id: string, userId: string, dto: CategoryDto) {
    const res = await this.prisma.category.updateMany({
      where: {
        id,
        store: { userId },
      },
      data: {
        title: dto.title,
        description: dto.description,
      },
    });
    if (res.count === 0) throw new NotFoundException('Category not found');

    return this.prisma.category.findUnique({ where: { id } });
  }

  async delete(id: string, userId: string) {
    const res = await this.prisma.category.deleteMany({
      where: {
        id,
        store: { userId },
      },
    });

    if (res.count === 0) throw new NotFoundException('Category not found');
    return { ok: true };
  }
}
