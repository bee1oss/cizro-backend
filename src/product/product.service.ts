import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus, StoreStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  /*SELLER */
  async createBySeller(actorId: string, dto: CreateProductDto) {
    const store = await this.prisma.store.findUnique({ where: { id: dto.storeId } });
    if (!store) throw new NotFoundException('Store not found');
    if (store.ownerId !== actorId) throw new ForbiddenException('Not your store');
    if (store.status !== StoreStatus.APPROVED)
      throw new BadRequestException('Store must be approved');

    // kategori kontrolü
    const cat = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!cat) throw new NotFoundException('Category not found');

    return this.prisma.product.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price as unknown as any, // Prisma Decimal alır
        stock: dto.stock,
        images: dto.images ?? [],
        categoryId: dto.categoryId,
        storeId: dto.storeId,
        status: ProductStatus.PENDING,
      },
    });
  }

  /* Satıcı: kendi ürününü güncelle (ACTIVE bile olsa temel alanlar) */
  async updateAsOwner(actorId: string, productId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const store = await this.prisma.store.findUnique({ where: { id: product.storeId } });
    if (!store) throw new NotFoundException('Store not found');
    if (store.ownerId !== actorId) throw new ForbiddenException('Not your product');

    // kategori değişimi istenirse kontrol et
    if (dto.categoryId) {
      const cat = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!cat) throw new NotFoundException('Category not found');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        title: dto.title ?? product.title,
        description: dto.description ?? product.description,
        price: (dto.price as unknown as any) ?? product.price,
        stock: dto.stock ?? product.stock,
        images: dto.images ?? product.images,
        categoryId: dto.categoryId ?? product.categoryId,
        // istersen güncellemeyi PENDING’e çekebilirsin (moderasyon):
        // status: ProductStatus.PENDING,
      },
    });
  }

  /* Admin: onay */
  async approve(productId: string, adminId: string) {
    const prod = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!prod) throw new NotFoundException('Product not found');
    return this.prisma.product.update({
      where: { id: productId },
      data: { status: ProductStatus.ACTIVE },
    });
  }

  /* Admin: reddet */
  async reject(productId: string, adminId: string, reason?: string) {
    const prod = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!prod) throw new NotFoundException('Product not found');
    // istersen reason’ı ayrı bir log tablosuna yaz
    return this.prisma.product.update({
      where: { id: productId },
      data: { status: ProductStatus.REJECTED },
    });
  }

  /* Public listeleme (ACTIVE olanlar) + filtre + sayfalama */
  async listPublic(q: QueryProductDto) {
    const where: Prisma.ProductWhereInput = { status: ProductStatus.ACTIVE };

    if (q.categoryId) where.categoryId = q.categoryId;
    if (q.storeId) where.storeId = q.storeId;
    if (q.q) where.title = { contains: q.q, mode: 'insensitive' };

    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;

    // Her zaman DİZİ ver → tip sorunlarını bitirir
    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      q.sort === 'price_asc'
        ? [{ price: 'asc' }, { createdAt: 'desc' }] // ikincil sırayı eklemek güzel
        : q.sort === 'price_desc'
          ? [{ price: 'desc' }, { createdAt: 'desc' }]
          : [{ createdAt: 'desc' }]; // default: en yeniler

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          price: true,
          stock: true,
          images: true,
          createdAt: true,
          store: { select: { id: true, title: true } },
          category: { select: { id: true, title: true, slug: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    };
  }
  /* Public detay (sadece ACTIVE ise) */
  async byIdPublic(id: string) {
    const prod = await this.prisma.product.findUnique({
      where: { id },
      include: {
        store: { select: { id: true, title: true, status: true } },
        category: { select: { id: true, title: true } },
        reviews: true,
      },
    });
    if (!prod || prod.status !== ProductStatus.ACTIVE)
      throw new NotFoundException('Product not found');
    return prod;
  }

  /* Seller: kendi ürünlerini listele (status fark etmez) */
  async listMine(actorId: string, storeId?: string) {
    const where: any = { store: { ownerId: actorId } };
    if (storeId) where.storeId = storeId;
    return this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
