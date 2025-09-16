import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class RefreshtokenService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, token: string) {
    return this.prisma.refreshToken.create({
      data: {
        userId,
        token,
      },
    });
  }
  async remove(token: string) {
    return this.prisma.refreshToken.deleteMany({
      where: { token },
    });
  }
  async exists(token: string): Promise<boolean> {
    const found = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    return !!found;
  }
}
