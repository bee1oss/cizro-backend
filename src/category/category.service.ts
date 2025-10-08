import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { slugify } from './utils/slugify';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    //parent kontrolu
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: {
          id: dto.parentId,
        },
      });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    const data = {
      title: dto.title.trim(),
      slug: slugify(dto.title),
      parentId: dto.parentId ?? null,
    };

    // if slug unique add counter
    let base = data.slug;
    let slug = base;
    let i = 2;
    while (await this.prisma.category.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }

    return this.prisma.category.create({
      data: { ...data, slug },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    let parentId = dto.parentId ?? existing.parentId ?? null;

    // kendisini ebeveyn yapmaya çalışma
    if (parentId === id) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    // parent varsa, var mı?
    if (parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');

      // döngü/çevrim engeli: yeni ebeveyn, bu kategorinin altlarında mı?
      const cycle = await this.isDescendant(parentId, id);
      if (cycle) throw new BadRequestException('Cannot move a category under its descendant');
    }

    let slug: string | undefined;
    if (dto.title && dto.title.trim() !== existing.title) {
      const base = slugify(dto.title);
      slug = base;
      let i = 2;
      while (await this.prisma.category.findUnique({ where: { slug } })) {
        slug = `${base}-${i++}`;
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        slug,
        parentId: dto.parentId === null ? null : parentId, // null gönderildiyse köke taşı
      },
    });
  }

  async remove(id: string) {
    // çocuk var mı?
    const child = await this.prisma.category.findFirst({ where: { parentId: id } });
    if (child) throw new BadRequestException('Category has children; remove or move them first');

    // ürün bağlı mı? (Product.categoryId varsa)
    const product = await this.prisma.product.findFirst({ where: { categoryId: id } });
    if (product) throw new BadRequestException('Category has products; reassign them first');

    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  // ağaç şeklinde getir (tüm köklerden)
  async tree() {
    const roots = await this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { title: 'asc' },
    });
    const nodesByParent: Record<string, any[]> = {};
    const all = await this.prisma.category.findMany();
    for (const c of all) {
      const key = c.parentId ?? 'root';
      (nodesByParent[key] ??= []).push(c);
    }
    const build = (node: any): any => {
      const children = nodesByParent[node.id] ?? [];
      return { ...node, children: children.map(build) };
    };
    return roots.map(build);
  }

  // yardımcı: parentCandidate, targetCategory’nin altlarında mı?
  private async isDescendant(parentCandidateId: string, targetId: string): Promise<boolean> {
    // BFS yükselerek kontrol (parent zincirinde targetId var mı?)
    let cur = await this.prisma.category.findUnique({ where: { id: parentCandidateId } });
    while (cur?.parentId) {
      if (cur.parentId === targetId) return true;
      cur = await this.prisma.category.findUnique({ where: { id: cur.parentId } });
    }
    return false;
  }

  async list(parentId?: string | null) {
    return this.prisma.category.findMany({
      where: { parentId: typeof parentId === 'undefined' ? null : parentId },
      orderBy: { title: 'asc' },
    });
  }
}
