import { Injectable } from '@nestjs/common';
import { hash, verify } from 'argon2';
import { AuthDto } from 'src/auth/dto/auth.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        stores: true,
      },
    });
    return user;
  }

  async getByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        stores: true,
      },
    });
    return user;
  }

  async create(dto: AuthDto) {
    return this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        password: await hash(dto.password),
      },
    });
  }

  async validatePassword(plainPass: string, hashedPass: string): Promise<boolean> {
    return await verify(hashedPass, plainPass);
  }
}
